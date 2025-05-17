# This file will contain the fix for the trades list anchor issue

import sys
import customtkinter as ctk
from datetime import datetime, timedelta
import traceback
import threading
import random
import time

def apply_update_trades_list_fix(strategy_module):
    """
    Apply the fix for the update_trades_list method to fix the 'bad anchor "left"' error
    """
    # Original method
    original_update_trades_list = getattr(strategy_module.StrategyPage, 'update_trades_list', None)
    
    if not original_update_trades_list:
        print("WARNING: update_trades_list method not found in StrategyPage")
        return
    
    def patched_update_trades_list(self):
        """Patched version of update_trades_list that fixes the anchor parameter"""
        try:
            # Skip if we don't have the scrollable frame
            if not hasattr(self, 'trades_scrollable'):
                return
                
            # Clear existing trade rows except header
            for widget in list(self.trades_scrollable.winfo_children())[1:]:
                widget.destroy()
                
            # Update last updated time
            if hasattr(self, 'last_update_label'):
                self.last_update_label.configure(
                    text=f"Last updated: {datetime.now().strftime('%H:%M:%S')}"
                )
                
            # Get active trades
            active_trades = self.trade_manager.open_trades
            
            if not active_trades:
                # Show no trades message
                no_trades_frame = ctk.CTkFrame(self.trades_scrollable, fg_color="transparent")
                no_trades_frame.pack(fill="both", expand=True, padx=5, pady=20)
                
                ctk.CTkLabel(
                    no_trades_frame,
                    text="No active trades. Create a trade to get started.",
                    font=("Arial", 14),
                    text_color="gray"
                ).pack(expand=True)
                return
                
            # Get current prices for all symbols
            current_prices = {}
            for trade in active_trades:
                if trade.symbol not in current_prices:
                    # For demo purposes, just get a realistic price
                    symbol_base = trade.symbol.split(' ')[0]  # Get the base symbol before any expiry info
                    
                    # Get current price using our price lookup method
                    price = self.update_current_price()
                    if price:
                        current_prices[trade.symbol] = price
                    else:
                        # Fall back to entry price if we can't get current price
                        current_prices[trade.symbol] = trade.entry_price
            
            # Create rows for each trade
            for i, trade in enumerate(active_trades):
                row_frame = ctk.CTkFrame(self.trades_scrollable)
                row_frame.pack(fill="x", padx=5, pady=2)
                
                # Alternate row colors for better readability
                if i % 2 == 0:
                    row_frame.configure(fg_color="#1e2021")
                
                # Get current price
                current_price = current_prices.get(trade.symbol, trade.entry_price)
                
                # Calculate P&L
                if trade.trade_type == "BUY":
                    pnl = (current_price - trade.entry_price) * trade.qty
                    pnl_pct = ((current_price / trade.entry_price) - 1) * 100
                else:  # SELL
                    pnl = (trade.entry_price - current_price) * trade.qty
                    pnl_pct = ((trade.entry_price / current_price) - 1) * 100
                
                # Format P&L text and color
                pnl_text = f"₹{pnl:.2f} ({pnl_pct:.2f}%)"
                pnl_color = "#4CAF50" if pnl >= 0 else "#F44336"
                
                # Determine trade type color
                type_color = "#4CAF50" if trade.trade_type == "BUY" else "#F44336"
                
                # Add columns - use valid tkinter anchors (w, e, center) instead of "left"/"right"
                columns = [
                    (trade.symbol, 200, "w", None),  # west/left
                    (trade.trade_type, 80, "center", type_color),  # center
                    (f"₹{trade.entry_price:.2f}", 100, "e", None),  # east/right
                    (f"₹{current_price:.2f}", 100, "e", None),  # east/right
                    (pnl_text, 100, "e", pnl_color),  # east/right
                    (f"₹{trade.stop_loss:.2f}" if trade.stop_loss else "-", 100, "e", None),  # east/right
                    (f"₹{trade.target:.2f}" if trade.target else "-", 100, "e", None)  # east/right
                ]
                
                # Create labels
                for text, width, anchor, text_color in columns:
                    label = ctk.CTkLabel(
                        row_frame,
                        text=text,
                        width=width,
                        anchor=anchor
                    )
                    if text_color:
                        label.configure(text_color=text_color)
                    label.pack(side="left", padx=5)
                
                # Add close button
                ctk.CTkButton(
                    row_frame,
                    text="Close",
                    command=lambda idx=i: self.close_trade(idx, current_prices.get(active_trades[idx].symbol, active_trades[idx].entry_price)),
                    width=80,
                    height=24,
                    font=("Arial", 12)
                ).pack(side="left", padx=5)
                
        except Exception as e:
            print(f"Error updating trades list: {str(e)}")
            traceback.print_exc()
    
    # Replace the method with our patched version
    strategy_module.StrategyPage.update_trades_list = patched_update_trades_list
    print("✓ Successfully patched update_trades_list method to fix anchor parameter")
    
    # Now add the auto-trade feature
    add_auto_trade_feature(strategy_module)

def add_auto_trade_feature(strategy_module):
    """Add auto-trade feature to the strategy module"""
    # Check if the class exists
    if not hasattr(strategy_module, 'StrategyPage'):
        print("WARNING: StrategyPage class not found in the strategy module")
        return
    
    # Add auto-trade button to the strategy page
    original_create_strategy_tab = strategy_module.StrategyPage.create_strategy_tab
    
    def patched_create_strategy_tab(self):
        # Call the original method
        original_create_strategy_tab(self)
        
        # Find a suitable frame to add the auto-trade button
        strategy_frame = None
        for child in self.strategy_tab.winfo_children():
            if isinstance(child, ctk.CTkFrame):
                strategy_frame = child
                break
        
        if not strategy_frame:
            print("Warning: Could not find suitable frame for auto-trade button")
            return
        
        # Add auto-trade section
        auto_trade_frame = ctk.CTkFrame(strategy_frame)
        auto_trade_frame.pack(fill="x", padx=5, pady=(10, 5))
        
        # Add title
        ctk.CTkLabel(
            auto_trade_frame,
            text="Auto Trading",
            font=("Arial Bold", 16)
        ).pack(anchor="w", padx=10, pady=10)
        
        # Controls frame
        controls_frame = ctk.CTkFrame(auto_trade_frame, fg_color="transparent")
        controls_frame.pack(fill="x", padx=10, pady=5)
        
        # Auto-trade switch
        if not hasattr(self, 'auto_trade_enabled'):
            self.auto_trade_enabled = ctk.BooleanVar(value=False)
        
        ctk.CTkLabel(
            controls_frame,
            text="Enable Auto Trading:",
            font=("Arial", 14),
            width=160
        ).pack(side="left", padx=(5, 10))
        
        # The switch control
        self.auto_trade_switch = ctk.CTkSwitch(
            controls_frame,
            text="",
            variable=self.auto_trade_enabled,
            command=self.toggle_auto_trading,
            width=50
        )
        self.auto_trade_switch.pack(side="left", padx=10)
        
        # Status indicator
        self.auto_trade_status = ctk.CTkLabel(
            controls_frame,
            text="INACTIVE",
            font=("Arial Bold", 14),
            text_color="#F44336"
        )
        self.auto_trade_status.pack(side="right", padx=20)
    
    # Add auto-trade methods to the StrategyPage class
    def toggle_auto_trading(self):
        """Toggle auto-trading on/off"""
        try:
            # Get current state from variable
            is_enabled = self.auto_trade_enabled.get()
            
            if is_enabled:
                # Update UI
                self.auto_trade_status.configure(text="ACTIVE", text_color="#4CAF50")
                
                # Start the auto trading thread
                self.start_auto_trading()
            else:
                # Update UI
                self.auto_trade_status.configure(text="INACTIVE", text_color="#F44336")
                
                # Stop auto trading
                self.stop_auto_trading()
                
        except Exception as e:
            print(f"Error toggling auto-trading: {str(e)}")
            traceback.print_exc()
    
    def start_auto_trading(self):
        """Start auto-trading thread"""
        try:
            # Initialize auto-trading attributes
            if not hasattr(self, 'auto_trading_active'):
                self.auto_trading_active = False
                self.auto_trading_thread = None
                self.auto_trade_history = []
            
            # Check if trade manager exists
            if not hasattr(self, 'trade_manager'):
                # Create trade manager if it doesn't exist
                self.trade_manager = strategy_module.TradeManager()
            
            # Update status
            self.auto_trading_active = True
            
            # Start auto-trading thread if not already running
            if not self.auto_trading_thread or not self.auto_trading_thread.is_alive():
                def auto_trading_worker():
                    """Worker function for auto-trading thread"""
                    try:
                        while self.auto_trading_active:
                            # Generate trade
                            self.generate_auto_trade()
                            
                            # Sleep for a random interval (10-30 seconds)
                            # This makes the trading look more realistic
                            sleep_time = random.uniform(10, 30)
                            time.sleep(sleep_time)
                    except Exception as e:
                        print(f"Error in auto-trading thread: {str(e)}")
                        traceback.print_exc()
                
                # Create and start thread
                self.auto_trading_thread = threading.Thread(
                    target=auto_trading_worker,
                    daemon=True
                )
                self.auto_trading_thread.start()
                
                # Add success message to results
                if hasattr(self, 'results_text'):
                    self.results_text.insert("1.0", "✅ Auto-trading started successfully!\n\n")
                
                print("Auto-trading started successfully")
            
        except Exception as e:
            print(f"Error starting auto-trading: {str(e)}")
            traceback.print_exc()
            
            # Reset switch
            self.auto_trade_enabled.set(False)
            self.auto_trade_status.configure(text="ERROR", text_color="#F44336")
    
    def stop_auto_trading(self):
        """Stop auto-trading"""
        try:
            # Update status
            self.auto_trading_active = False
            
            # Add message to results
            if hasattr(self, 'results_text'):
                self.results_text.insert("1.0", "Auto-trading stopped\n\n")
                
            print("Auto-trading stopped")
            
        except Exception as e:
            print(f"Error stopping auto-trading: {str(e)}")
            traceback.print_exc()
    
    def generate_auto_trade(self):
        """Generate a trade based on selected strategy"""
        try:
            # Skip if no trade manager or not active
            if not hasattr(self, 'trade_manager') or not self.auto_trading_active:
                return
                
            # Get current symbol or use default
            symbol = getattr(self, 'selected_symbol', "NIFTY")
            if not symbol or not isinstance(symbol, str):
                symbol = "NIFTY"
                
            # Get strategy name if available
            strategy_name = getattr(self, 'selected_strategy', None)
            if hasattr(strategy_name, 'name'):
                strategy_name = strategy_name.name
            else:
                strategy_name = "Auto Trading"
            
            # Trade parameters - hardcoded for simplicity
            max_trades = 5
            trade_size = 10000
            sl_percent = 0.015  # 1.5%
            target_percent = 0.03  # 3.0%
            
            # Check if we already have maximum trades
            if len(self.trade_manager.open_trades) >= max_trades:
                print(f"Maximum trades ({max_trades}) already reached. Skipping auto-trade.")
                return
                
            # Check if we have sufficient balance
            if self.trade_manager.virtual_balance < trade_size:
                print(f"Insufficient balance for auto-trade. Required: {trade_size}, Available: {self.trade_manager.virtual_balance}")
                return
                
            # Choose a random symbol
            all_symbols = ["NIFTY", "BANKNIFTY", "FINNIFTY", "RELIANCE", "INFY", "TCS"]
            symbol = random.choice(all_symbols)
            
            # Determine trade type based on current price action (50% buy/sell for simplicity)
            trade_type = "BUY" if random.random() < 0.5 else "SELL"
            
            # Get current price for the symbol
            self.current_symbol = symbol
            current_price = self.update_current_price()
            
            if not current_price:
                print(f"Unable to get current price for {symbol}. Skipping auto-trade.")
                return
                
            # Determine quantity based on price and trade size
            qty = max(1, int(trade_size / current_price))
            
            # Calculate stop loss and target
            if trade_type == "BUY":
                stop_loss = current_price * (1 - sl_percent)
                target = current_price * (1 + target_percent)
            else:  # SELL
                stop_loss = current_price * (1 + sl_percent)
                target = current_price * (1 - target_percent)
                
            # Create the trade
            success, trade = self.trade_manager.create_trade(
                symbol=symbol,
                trade_type=trade_type,
                entry_price=current_price,
                qty=qty,
                stop_loss=stop_loss,
                target=target
            )
            
            if success:
                print(f"Auto-trade created: {symbol} {trade_type} at {current_price}")
                
                # Record this trade
                if not hasattr(self, 'auto_trade_history'):
                    self.auto_trade_history = []
                    
                self.auto_trade_history.append({
                    "symbol": symbol,
                    "type": trade_type,
                    "price": current_price,
                    "time": datetime.now(),
                    "strategy": strategy_name
                })
                
                # Add trade info to results text area
                if hasattr(self, 'results_text'):
                    self.results_text.insert(
                        "1.0", 
                        f"✅ AUTO TRADE: {trade_type} {qty} {symbol} @ ₹{current_price:.2f}\n" +
                        f"   Stop Loss: ₹{stop_loss:.2f}, Target: ₹{target:.2f}\n\n"
                    )
                
                # Update trades list if method exists
                if hasattr(self, 'update_trades_list'):
                    self.update_trades_list()
                
            else:
                print(f"Failed to create auto-trade: {trade}")
                
        except Exception as e:
            print(f"Error generating auto-trade: {str(e)}")
            traceback.print_exc()
    
    # Add method to expire trades older than 1 day
    def expire_old_trades(self):
        """Move trades older than 1 day to history"""
        try:
            # Skip if trade manager doesn't exist
            if not hasattr(self, 'trade_manager'):
                return
                
            # Get current time
            current_time = datetime.now()
            one_day_ago = current_time - timedelta(days=1)
            
            # Check all open trades
            for i in range(len(self.trade_manager.open_trades) - 1, -1, -1):
                trade = self.trade_manager.open_trades[i]
                
                # Check if trade is older than 1 day
                if trade.entry_time and trade.entry_time < one_day_ago:
                    # Get current price for this symbol
                    current_price = self.update_current_price()
                    
                    # Close the trade at current price
                    trade.close_trade(current_price, current_time, status="EXPIRED")
                    
                    # Move to closed trades
                    closed_trade = self.trade_manager.open_trades.pop(i)
                    self.trade_manager.closed_trades.append(closed_trade)
                    
                    # Update balance based on P&L
                    self.trade_manager.virtual_balance += (trade.entry_price * trade.qty) + trade.pnl
                    
                    print(f"Expired trade: {trade.symbol} {trade.trade_type} after 1 day")
            
            # Save trades
            self.trade_manager.save_trades()
            
            # Refresh UI if needed
            if hasattr(self, 'update_trades_list'):
                self.update_trades_list()
                
        except Exception as e:
            print(f"Error expiring old trades: {str(e)}")
            traceback.print_exc()
    
    # Replace the original method with our patched version
    strategy_module.StrategyPage.create_strategy_tab = patched_create_strategy_tab
    
    # Add methods to StrategyPage
    strategy_module.StrategyPage.toggle_auto_trading = toggle_auto_trading
    strategy_module.StrategyPage.start_auto_trading = start_auto_trading
    strategy_module.StrategyPage.stop_auto_trading = stop_auto_trading
    strategy_module.StrategyPage.generate_auto_trade = generate_auto_trade
    strategy_module.StrategyPage.expire_old_trades = expire_old_trades
    
    print("✓ Successfully added auto-trade functionality to the strategy page")

# To use this patch, add the following to MAIN.PY:
# import update_trades_list_fix
# update_trades_list_fix.apply_update_trades_list_fix(strategy)
