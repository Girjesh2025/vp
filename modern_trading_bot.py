import tkinter as tk
import customtkinter as ctk
import numpy as np
from datetime import datetime

class ModernTradingBot:
    def __init__(self):
        self.root = ctk.CTk()
        self.root.title("🤖 Quantum Trading Bot")
        self.root.geometry("1400x900")
        
        # Set theme
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")
        
        # Initialize variables
        self.pnl = 0
        self.trades = 0
        self.win_rate = 0
        self.is_trading = False
        
        self.create_gui()
        
    def create_gui(self):
        # Main container with gradient effect
        self.container = ctk.CTkFrame(self.root, fg_color=("#1A1A2E", "#1A1A2E"))
        self.container.pack(fill='both', expand=True, padx=20, pady=20)
        
        # Create three columns
        self.create_left_panel()
        self.create_middle_panel()
        self.create_right_panel()
        
    def create_left_panel(self):
        left_panel = ctk.CTkFrame(self.container, fg_color=("#16213E", "#16213E"))
        left_panel.pack(side='left', fill='y', padx=(0,10))
        
        # Strategy Selection
        strategy_frame = ctk.CTkFrame(left_panel, fg_color="transparent")
        strategy_frame.pack(fill='x', pady=10)
        
        ctk.CTkLabel(
            strategy_frame,
            text="Trading Strategy",
            font=("Helvetica", 20, "bold"),
            text_color="#4ECCA3"
        ).pack(pady=10)
        
        strategies = [
            "VWAP Momentum",
            "Mean Reversion",
            "Breakout Trading",
            "Grid Trading",
            "Options Strangle",
            "ML Strategy"
        ]
        
        self.strategy_var = ctk.StringVar(value=strategies[0])
        
        for strategy in strategies:
            ctk.CTkRadioButton(
                strategy_frame,
                text=strategy,
                variable=self.strategy_var,
                value=strategy,
                font=("Helvetica", 16),
                fg_color="#4ECCA3",
                border_color="#4ECCA3"
            ).pack(pady=5, padx=20, anchor='w')
        
        # Risk Management
        risk_frame = ctk.CTkFrame(left_panel, fg_color="transparent")
        risk_frame.pack(fill='x', pady=20)
        
        ctk.CTkLabel(
            risk_frame,
            text="Risk Management",
            font=("Helvetica", 20, "bold"),
            text_color="#4ECCA3"
        ).pack(pady=10)
        
        # Risk Sliders
        self.create_slider(risk_frame, "Risk Per Trade (%)", 0.1, 2.0, 0.5)
        self.create_slider(risk_frame, "Stop Loss (%)", 0.5, 5.0, 1.0)
        
        # Control Buttons
        control_frame = ctk.CTkFrame(left_panel, fg_color="transparent")
        control_frame.pack(fill='x', pady=20)
        
        self.start_button = ctk.CTkButton(
            control_frame,
            text="Start Trading",
            command=self.toggle_trading,
            font=("Helvetica", 18, "bold"),
            height=50,
            fg_color="#4ECCA3",
            hover_color="#45B08C",
            corner_radius=10
        )
        self.start_button.pack(fill='x', padx=20, pady=5)
        
        self.stop_button = ctk.CTkButton(
            control_frame,
            text="Emergency Stop",
            command=self.emergency_stop,
            font=("Helvetica", 18, "bold"),
            height=50,
            fg_color="#E74C3C",
            hover_color="#C0392B",
            corner_radius=10,
            state="disabled"
        )
        self.stop_button.pack(fill='x', padx=20, pady=5)
        
    def create_middle_panel(self):
        middle_panel = ctk.CTkFrame(self.container, fg_color=("#16213E", "#16213E"))
        middle_panel.pack(side='left', fill='both', expand=True, padx=10)
        
        # Stats Bar
        stats_frame = ctk.CTkFrame(middle_panel, fg_color="transparent")
        stats_frame.pack(fill='x', pady=(0,20))
        
        # P&L Display
        pnl_frame = ctk.CTkFrame(stats_frame, fg_color="transparent")
        pnl_frame.pack(side='left')
        
        self.pnl_label = ctk.CTkLabel(
            pnl_frame,
            text="₹0.00",
            font=("Helvetica", 32, "bold"),
            text_color="#4ECCA3"
        )
        self.pnl_label.pack()
        
        self.pnl_percent = ctk.CTkLabel(
            pnl_frame,
            text="(0.00%)",
            font=("Helvetica", 18),
            text_color="#4ECCA3"
        )
        self.pnl_percent.pack()
        
        # Win Rate
        self.winrate_label = ctk.CTkLabel(
            stats_frame,
            text="Win Rate: 0%",
            font=("Helvetica", 24),
            text_color="#FFFFFF"
        )
        self.winrate_label.pack(side='right', padx=20)
        
        # Chart Area (Placeholder)
        chart_frame = ctk.CTkFrame(middle_panel, fg_color="#232D3F")
        chart_frame.pack(fill='both', expand=True, pady=10)
        
        ctk.CTkLabel(
            chart_frame,
            text="Chart Area",
            font=("Helvetica", 24, "bold")
        ).pack(pady=100)
        
    def create_right_panel(self):
        right_panel = ctk.CTkFrame(self.container, fg_color=("#16213E", "#16213E"))
        right_panel.pack(side='left', fill='y', padx=(10,0))
        
        # Performance Metrics
        metrics_frame = ctk.CTkFrame(right_panel, fg_color="transparent")
        metrics_frame.pack(fill='x', pady=10)
        
        ctk.CTkLabel(
            metrics_frame,
            text="Performance Metrics",
            font=("Helvetica", 20, "bold"),
            text_color="#4ECCA3"
        ).pack(pady=10)
        
        self.create_metric_box(metrics_frame, "Total Trades", "0")
        self.create_metric_box(metrics_frame, "Win Rate", "0%")
        self.create_metric_box(metrics_frame, "Avg Profit", "₹0.00")
        self.create_metric_box(metrics_frame, "Max Drawdown", "0%")
        self.create_metric_box(metrics_frame, "Sharpe Ratio", "0.00")
        
        # Trade Log
        log_frame = ctk.CTkFrame(right_panel, fg_color="transparent")
        log_frame.pack(fill='both', expand=True, pady=10)
        
        ctk.CTkLabel(
            log_frame,
            text="Trade Log",
            font=("Helvetica", 20, "bold"),
            text_color="#4ECCA3"
        ).pack(pady=10)
        
        self.trade_log = ctk.CTkTextbox(
            log_frame,
            font=("Consolas", 14),
            fg_color="#232D3F",
            text_color="#FFFFFF",
            corner_radius=10
        )
        self.trade_log.pack(fill='both', expand=True, padx=10, pady=5)
        
    def create_slider(self, parent, label, min_val, max_val, default):
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        frame.pack(fill='x', padx=20, pady=5)
        
        ctk.CTkLabel(
            frame,
            text=label,
            font=("Helvetica", 14)
        ).pack()
        
        slider = ctk.CTkSlider(
            frame,
            from_=min_val,
            to=max_val,
            number_of_steps=int((max_val-min_val)*10),
            fg_color="#232D3F",
            progress_color="#4ECCA3",
            button_color="#4ECCA3",
            button_hover_color="#45B08C"
        )
        slider.set(default)
        slider.pack(fill='x', pady=5)
        
        return slider
    
    def create_metric_box(self, parent, label, value):
        frame = ctk.CTkFrame(parent, fg_color="#232D3F")
        frame.pack(fill='x', padx=10, pady=5)
        
        ctk.CTkLabel(
            frame,
            text=label,
            font=("Helvetica", 14)
        ).pack(pady=5)
        
        ctk.CTkLabel(
            frame,
            text=value,
            font=("Helvetica", 16, "bold"),
            text_color="#4ECCA3"
        ).pack(pady=5)
        
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
    
    def emergency_stop(self):
        self.is_trading = False
        self.log_message("⚠️ EMERGENCY STOP - Closing all positions!")
        self.stop_trading()
    
    def start_trading(self):
        self.log_message(f"Starting {self.strategy_var.get()} strategy")
        self.simulate_trading()
    
    def stop_trading(self):
        self.is_trading = False
        self.start_button.configure(
            text="Start Trading",
            fg_color="#4ECCA3",
            hover_color="#45B08C"
        )
        self.stop_button.configure(state="disabled")
        self.log_message("Trading stopped")
    
    def simulate_trading(self):
        if self.is_trading:
            # Simulate a trade
            pnl_change = np.random.normal(100, 500)
            self.pnl += pnl_change
            self.trades += 1
            self.win_rate = (self.trades % 3) / 3 * 100  # Simulated win rate
            
            # Update labels
            pnl_percent = (self.pnl / 100000) * 100
            color = "#4ECCA3" if self.pnl >= 0 else "#E74C3C"
            
            self.pnl_label.configure(
                text=f"₹{self.pnl:,.2f}",
                text_color=color
            )
            self.pnl_percent.configure(
                text=f"({pnl_percent:+.2f}%)",
                text_color=color
            )
            self.winrate_label.configure(text=f"Win Rate: {self.win_rate:.1f}%")
            
            # Log the trade
            self.log_message(
                f"Trade executed: ₹{pnl_change:+,.2f} ({(pnl_change/100000)*100:+.2f}%)"
            )
            
            # Schedule next update
            self.root.after(2000, self.simulate_trading)
    
    def log_message(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.trade_log.insert('end', f"[{timestamp}] {message}\n")
        self.trade_log.see('end')
    
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = ModernTradingBot()
    app.run() 