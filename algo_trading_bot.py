import tkinter as tk
from tkinter import ttk
import pandas as pd
import numpy as np
from datetime import datetime
import threading
import time
import customtkinter as ctk

class AlgoTradingBot:
    def __init__(self):
        self.root = ctk.CTk()
        self.root.title("🤖 Algo Trading Bot")
        self.root.geometry("1400x900")
        
        # Set theme
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")
        
        # Trading variables
        self.is_trading = False
        self.current_strategy = None
        self.pnl = 0
        self.trades_today = 0
        
        self.create_gui()
        
    def create_gui(self):
        # Create main container
        container = ctk.CTkFrame(self.root)
        container.pack(fill='both', expand=True, padx=20, pady=20)
        
        # Left Panel - Strategy & Controls
        left_panel = ctk.CTkFrame(container)
        left_panel.pack(side='left', fill='y', padx=(0,10))
        
        # Strategy Section
        strategy_frame = ctk.CTkFrame(left_panel)
        strategy_frame.pack(fill='x', pady=(0,10))
        
        ctk.CTkLabel(
            strategy_frame,
            text="Trading Strategy",
            font=("Helvetica", 16, "bold")
        ).pack(pady=10)
        
        # Strategy Selection
        strategies = [
            "VWAP Momentum",
            "Mean Reversion",
            "Breakout Trading",
            "Grid Trading",
            "Options Strangle",
            "Futures Scalping"
        ]
        
        self.strategy_var = ctk.StringVar(value=strategies[0])
        strategy_menu = ctk.CTkOptionMenu(
            strategy_frame,
            values=strategies,
            variable=self.strategy_var,
            width=200
        )
        strategy_menu.pack(pady=5)
        
        # Parameters Frame
        param_frame = ctk.CTkFrame(left_panel)
        param_frame.pack(fill='x', pady=10)
        
        ctk.CTkLabel(
            param_frame,
            text="Strategy Parameters",
            font=("Helvetica", 16, "bold")
        ).pack(pady=10)
        
        # Risk Parameters
        risk_frame = ctk.CTkFrame(param_frame)
        risk_frame.pack(fill='x', padx=10, pady=5)
        
        ctk.CTkLabel(
            risk_frame,
            text="Risk Per Trade (%)"
        ).pack()
        
        self.risk_slider = ctk.CTkSlider(
            risk_frame,
            from_=0.1,
            to=2.0,
            number_of_steps=19
        )
        self.risk_slider.pack(fill='x', padx=10, pady=5)
        
        # Stop Loss
        sl_frame = ctk.CTkFrame(param_frame)
        sl_frame.pack(fill='x', padx=10, pady=5)
        
        ctk.CTkLabel(
            sl_frame,
            text="Stop Loss (%)"
        ).pack()
        
        self.sl_slider = ctk.CTkSlider(
            sl_frame,
            from_=0.5,
            to=5.0,
            number_of_steps=45
        )
        self.sl_slider.pack(fill='x', padx=10, pady=5)
        
        # Control Buttons
        control_frame = ctk.CTkFrame(left_panel)
        control_frame.pack(fill='x', pady=10)
        
        self.start_button = ctk.CTkButton(
            control_frame,
            text="Start Trading",
            command=self.toggle_trading,
            font=("Helvetica", 14, "bold"),
            fg_color="#2ECC71",
            hover_color="#27AE60"
        )
        self.start_button.pack(fill='x', padx=10, pady=5)
        
        self.stop_button = ctk.CTkButton(
            control_frame,
            text="Emergency Stop",
            command=self.emergency_stop,
            font=("Helvetica", 14, "bold"),
            fg_color="#E74C3C",
            hover_color="#C0392B",
            state="disabled"
        )
        self.stop_button.pack(fill='x', padx=10, pady=5)
        
        # Right Panel - Stats & Trades
        right_panel = ctk.CTkFrame(container)
        right_panel.pack(side='left', fill='both', expand=True)
        
        # Stats Bar
        stats_frame = ctk.CTkFrame(right_panel)
        stats_frame.pack(fill='x', pady=(0,10))
        
        # P&L Display
        self.pnl_label = ctk.CTkLabel(
            stats_frame,
            text="P&L: ₹0.00",
            font=("Helvetica", 20, "bold"),
            text_color="#2ECC71"
        )
        self.pnl_label.pack(side='left', padx=20, pady=10)
        
        # Trades Counter
        self.trades_label = ctk.CTkLabel(
            stats_frame,
            text="Trades: 0",
            font=("Helvetica", 20)
        )
        self.trades_label.pack(side='left', padx=20, pady=10)
        
        # Win Rate
        self.winrate_label = ctk.CTkLabel(
            stats_frame,
            text="Win Rate: 0%",
            font=("Helvetica", 20)
        )
        self.winrate_label.pack(side='left', padx=20, pady=10)
        
        # Active Positions
        positions_frame = ctk.CTkFrame(right_panel)
        positions_frame.pack(fill='x', pady=10)
        
        ctk.CTkLabel(
            positions_frame,
            text="Active Positions",
            font=("Helvetica", 16, "bold")
        ).pack(pady=10)
        
        # Positions Table
        style = ttk.Style()
        style.configure(
            "Treeview",
            background="#2C3E50",
            foreground="white",
            fieldbackground="#2C3E50",
            rowheight=25
        )
        
        self.positions_tree = ttk.Treeview(
            positions_frame,
            columns=("Symbol", "Entry", "Current", "P&L", "Strategy"),
            show="headings",
            height=5
        )
        
        for col in ("Symbol", "Entry", "Current", "P&L", "Strategy"):
            self.positions_tree.heading(col, text=col)
            self.positions_tree.column(col, width=100)
        
        self.positions_tree.pack(fill='x', padx=10, pady=5)
        
        # Trade Log
        log_frame = ctk.CTkFrame(right_panel)
        log_frame.pack(fill='both', expand=True, pady=10)
        
        ctk.CTkLabel(
            log_frame,
            text="Trade Log",
            font=("Helvetica", 16, "bold")
        ).pack(pady=10)
        
        self.trade_log = ctk.CTkTextbox(
            log_frame,
            height=200
        )
        self.trade_log.pack(fill='both', expand=True, padx=10, pady=5)
        
    def toggle_trading(self):
        if not self.is_trading:
            self.is_trading = True
            self.start_button.configure(
                text="Stop Trading",
                fg_color="#E74C3C",
                hover_color="#C0392B"
            )
            self.stop_button.configure(state="normal")
            self.start_trading()
        else:
            self.stop_trading()
    
    def start_trading(self):
        """Start the trading algorithm"""
        strategy = self.strategy_var.get()
        risk = self.risk_slider.get()
        sl = self.sl_slider.get()
        
        self.log_message(f"Starting {strategy} strategy")
        self.log_message(f"Risk per trade: {risk}%")
        self.log_message(f"Stop Loss: {sl}%")
        
        # Start trading thread
        self.trading_thread = threading.Thread(target=self.run_strategy)
        self.trading_thread.daemon = True
        self.trading_thread.start()
    
    def stop_trading(self):
        """Stop trading normally"""
        self.is_trading = False
        self.start_button.configure(
            text="Start Trading",
            fg_color="#2ECC71",
            hover_color="#27AE60"
        )
        self.stop_button.configure(state="disabled")
        self.log_message("Trading stopped normally")
    
    def emergency_stop(self):
        """Emergency stop - close all positions"""
        self.is_trading = False
        self.log_message("⚠️ EMERGENCY STOP - Closing all positions!")
        # Add position closing logic here
        self.stop_trading()
    
    def run_strategy(self):
        """Run the selected trading strategy"""
        while self.is_trading:
            # Simulate trading activity
            time.sleep(2)
            self.update_stats()
    
    def update_stats(self):
        """Update trading statistics"""
        # Simulate P&L changes
        self.pnl += np.random.normal(0, 100)
        self.trades_today += 1
        
        # Update labels
        self.pnl_label.configure(
            text=f"P&L: ₹{self.pnl:,.2f}",
            text_color="#2ECC71" if self.pnl >= 0 else "#E74C3C"
        )
        self.trades_label.configure(text=f"Trades: {self.trades_today}")
        
        # Log activity
        self.log_message(f"Trade executed at {datetime.now().strftime('%H:%M:%S')}")
    
    def log_message(self, message):
        """Add message to trade log"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.trade_log.insert('end', f"[{timestamp}] {message}\n")
        self.trade_log.see('end')
    
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = AlgoTradingBot()
    app.run() 