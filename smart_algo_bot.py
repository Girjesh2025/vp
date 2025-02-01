import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import yfinance as yf

class SmartAlgoBot:
    def __init__(self):
        # ... (previous init code)
        
        # Portfolio metrics
        self.initial_capital = 100000  # ₹1 Lakh initial capital
        self.current_capital = self.initial_capital
        self.max_capital = self.initial_capital
        self.min_capital = self.initial_capital
        
        # Performance tracking
        self.daily_returns = []
        self.trades_history = []
        self.win_trades = 0
        self.loss_trades = 0
        
        # Risk metrics
        self.max_drawdown = 0
        self.sharpe_ratio = 0
        self.risk_free_rate = 0.06  # 6% risk-free rate
        
        self.create_gui()
        self.start_metrics_update()

    def create_performance_panel(self, parent):
        panel = ctk.CTkFrame(parent)
        
        # Today's Performance
        today_frame = ctk.CTkFrame(panel)
        today_frame.pack(fill='x', pady=5, padx=10)
        
        ctk.CTkLabel(
            today_frame,
            text="Today's Performance",
            font=("Helvetica", 20, "bold")
        ).pack(pady=5)
        
        # P&L Amount and Percentage
        pnl_frame = ctk.CTkFrame(today_frame)
        pnl_frame.pack(fill='x', pady=5)
        
        self.pnl_amount_label = ctk.CTkLabel(
            pnl_frame,
            text="₹0.00",
            font=("Helvetica", 24, "bold"),
            text_color="#2ECC71"
        )
        self.pnl_amount_label.pack(side='left', padx=10)
        
        self.pnl_percent_label = ctk.CTkLabel(
            pnl_frame,
            text="(0.00%)",
            font=("Helvetica", 20),
            text_color="#2ECC71"
        )
        self.pnl_percent_label.pack(side='left')
        
        # Key Metrics Grid
        metrics_grid = ctk.CTkFrame(panel)
        metrics_grid.pack(fill='x', pady=10, padx=10)
        
        # Row 1
        row1 = ctk.CTkFrame(metrics_grid)
        row1.pack(fill='x', pady=2)
        
        self.create_metric_box(row1, "Win Rate", "0%", "win_rate", side='left')
        self.create_metric_box(row1, "Profit Factor", "0.00", "profit_factor", side='right')
        
        # Row 2
        row2 = ctk.CTkFrame(metrics_grid)
        row2.pack(fill='x', pady=2)
        
        self.create_metric_box(row2, "Avg Win", "₹0.00 (0%)", "avg_win", side='left')
        self.create_metric_box(row2, "Avg Loss", "₹0.00 (0%)", "avg_loss", side='right')
        
        # Row 3
        row3 = ctk.CTkFrame(metrics_grid)
        row3.pack(fill='x', pady=2)
        
        self.create_metric_box(row3, "Max Drawdown", "0%", "max_drawdown", side='left')
        self.create_metric_box(row3, "Sharpe Ratio", "0.00", "sharpe_ratio", side='right')
        
        return panel

    def create_metric_box(self, parent, title, initial_value, key, side='left'):
        frame = ctk.CTkFrame(parent)
        frame.pack(side=side, expand=True, fill='x', padx=5)
        
        ctk.CTkLabel(
            frame,
            text=title,
            font=("Helvetica", 14)
        ).pack()
        
        label = ctk.CTkLabel(
            frame,
            text=initial_value,
            font=("Helvetica", 16, "bold")
        )
        label.pack()
        
        self.metric_labels[key] = label

    def update_metrics(self):
        if not self.trades_history:
            return
            
        # Calculate P&L
        total_pnl = self.current_capital - self.initial_capital
        pnl_percentage = (total_pnl / self.initial_capital) * 100
        
        # Update P&L labels with colors
        color = "#2ECC71" if total_pnl >= 0 else "#E74C3C"
        self.pnl_amount_label.configure(
            text=f"₹{total_pnl:,.2f}",
            text_color=color
        )
        self.pnl_percent_label.configure(
            text=f"({pnl_percentage:+.2f}%)",
            text_color=color
        )
        
        # Calculate win rate
        total_trades = self.win_trades + self.loss_trades
        win_rate = (self.win_trades / total_trades * 100) if total_trades > 0 else 0
        
        # Calculate profit factor
        total_profits = sum(t['pnl'] for t in self.trades_history if t['pnl'] > 0)
        total_losses = abs(sum(t['pnl'] for t in self.trades_history if t['pnl'] < 0))
        profit_factor = total_profits / total_losses if total_losses > 0 else 0
        
        # Calculate average win/loss
        winning_trades = [t['pnl'] for t in self.trades_history if t['pnl'] > 0]
        losing_trades = [t['pnl'] for t in self.trades_history if t['pnl'] < 0]
        
        avg_win = np.mean(winning_trades) if winning_trades else 0
        avg_loss = np.mean(losing_trades) if losing_trades else 0
        
        avg_win_pct = (avg_win / self.initial_capital) * 100
        avg_loss_pct = (avg_loss / self.initial_capital) * 100
        
        # Calculate Sharpe Ratio
        returns = pd.Series(self.daily_returns)
        if len(returns) > 1:
            excess_returns = returns - (self.risk_free_rate / 252)  # Daily risk-free rate
            sharpe = np.sqrt(252) * (excess_returns.mean() / excess_returns.std())
        else:
            sharpe = 0
        
        # Update metric labels
        self.metric_labels["win_rate"].configure(text=f"{win_rate:.1f}%")
        self.metric_labels["profit_factor"].configure(text=f"{profit_factor:.2f}")
        self.metric_labels["avg_win"].configure(text=f"₹{avg_win:,.2f} ({avg_win_pct:+.1f}%)")
        self.metric_labels["avg_loss"].configure(text=f"₹{avg_loss:,.2f} ({avg_loss_pct:+.1f}%)")
        self.metric_labels["max_drawdown"].configure(text=f"{self.max_drawdown:.1f}%")
        self.metric_labels["sharpe_ratio"].configure(text=f"{sharpe:.2f}")

    def simulate_trade(self):
        """Simulate a trade for testing"""
        # Simulate P&L
        pnl = np.random.normal(100, 500)  # Random P&L with mean 100 and std 500
        
        # Update capital
        self.current_capital += pnl
        self.max_capital = max(self.max_capital, self.current_capital)
        self.min_capital = min(self.min_capital, self.current_capital)
        
        # Calculate drawdown
        current_drawdown = ((self.max_capital - self.current_capital) / self.max_capital) * 100
        self.max_drawdown = max(self.max_drawdown, current_drawdown)
        
        # Update trade counts
        if pnl > 0:
            self.win_trades += 1
        else:
            self.loss_trades += 1
        
        # Record trade
        trade = {
            'timestamp': datetime.now(),
            'pnl': pnl,
            'capital': self.current_capital
        }
        self.trades_history.append(trade)
        
        # Calculate daily return
        daily_return = pnl / self.current_capital
        self.daily_returns.append(daily_return)
        
        # Update metrics
        self.update_metrics()
        
        # Log trade
        self.log_message(
            f"Trade completed: ₹{pnl:+,.2f} ({(pnl/self.initial_capital)*100:+.2f}%)"
        )

    def start_metrics_update(self):
        """Start periodic metrics updates"""
        def update():
            if self.is_trading:
                self.simulate_trade()
            self.root.after(2000, update)  # Update every 2 seconds
            
        self.root.after(2000, update) 