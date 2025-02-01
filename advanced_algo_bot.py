import tkinter as tk
from tkinter import ttk
import pandas as pd
import numpy as np
from datetime import datetime
import threading
import time
import customtkinter as ctk
from PIL import Image, ImageTk
import plotly.graph_objects as go
from plotly.subplots import make_subplots

class AdvancedAlgoBot:
    def __init__(self):
        self.root = ctk.CTk()
        self.root.title("🤖 Quantum Algo Trading Bot")
        self.root.geometry("1600x1000")
        
        # Set theme
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")
        
        # Trading variables
        self.is_trading = False
        self.current_strategy = None
        self.pnl = 0
        self.trades_today = 0
        self.win_rate = 0
        self.total_trades = 0
        
        # Initialize strategy parameters
        self.init_strategy_params()
        
        self.create_gui()
        
    def init_strategy_params(self):
        self.strategy_params = {
            "VWAP Momentum": {
                "lookback": 20,
                "volume_factor": 1.5,
                "momentum_threshold": 0.02
            },
            "Mean Reversion": {
                "ma_period": 50,
                "std_dev": 2,
                "mean_period": 20
            },
            "Breakout Trading": {
                "breakout_period": 20,
                "confirmation_candles": 3,
                "volume_multiplier": 2
            },
            "Grid Trading": {
                "grid_levels": 5,
                "grid_spacing": 0.5,
                "position_size": 100
            },
            "Options Strangle": {
                "delta": 0.3,
                "dte": 30,
                "iv_rank_min": 50
            },
            "ML Strategy": {
                "model_type": "LSTM",
                "prediction_period": 5,
                "confidence_threshold": 0.75
            }
        }
        
    def create_gui(self):
        # Create main container with gradient background
        container = ctk.CTkFrame(self.root)
        container.pack(fill='both', expand=True, padx=20, pady=20)
        
        # Create three main columns
        left_panel = self.create_left_panel(container)
        middle_panel = self.create_middle_panel(container)
        right_panel = self.create_right_panel(container)
        
        # Pack panels
        left_panel.pack(side='left', fill='y', padx=(0,10))
        middle_panel.pack(side='left', fill='both', expand=True, padx=10)
        right_panel.pack(side='left', fill='y', padx=(10,0))
        
    def create_left_panel(self, parent):
        panel = ctk.CTkFrame(parent)
        
        # Strategy Selection
        strategy_frame = ctk.CTkFrame(panel)
        strategy_frame.pack(fill='x', pady=(0,10))
        
        ctk.CTkLabel(
            strategy_frame,
            text="Trading Strategy",
            font=("Helvetica", 18, "bold")
        ).pack(pady=10)
        
        strategies = list(self.strategy_params.keys())
        self.strategy_var = ctk.StringVar(value=strategies[0])
        
        for strategy in strategies:
            ctk.CTkRadioButton(
                strategy_frame,
                text=strategy,
                variable=self.strategy_var,
                value=strategy,
                command=self.update_strategy_params
            ).pack(pady=5, padx=20, anchor='w')
        
        # Strategy Parameters
        self.param_frame = ctk.CTkFrame(panel)
        self.param_frame.pack(fill='x', pady=10)
        
        self.update_strategy_params()
        
        # Risk Management
        risk_frame = ctk.CTkFrame(panel)
        risk_frame.pack(fill='x', pady=10)
        
        ctk.CTkLabel(
            risk_frame,
            text="Risk Management",
            font=("Helvetica", 18, "bold")
        ).pack(pady=10)
        
        # Risk per trade slider
        ctk.CTkLabel(risk_frame, text="Risk Per Trade (%)").pack(pady=5)
        self.risk_slider = ctk.CTkSlider(
            risk_frame,
            from_=0.1,
            to=2.0,
            number_of_steps=19
        )
        self.risk_slider.pack(fill='x', padx=20, pady=5)
        
        # Stop loss slider
        ctk.CTkLabel(risk_frame, text="Stop Loss (%)").pack(pady=5)
        self.sl_slider = ctk.CTkSlider(
            risk_frame,
            from_=0.5,
            to=5.0,
            number_of_steps=45
        )
        self.sl_slider.pack(fill='x', padx=20, pady=5)
        
        # Control buttons
        control_frame = ctk.CTkFrame(panel)
        control_frame.pack(fill='x', pady=20)
        
        self.start_button = ctk.CTkButton(
            control_frame,
            text="Start Trading",
            command=self.toggle_trading,
            font=("Helvetica", 16, "bold"),
            height=40,
            fg_color="#2ECC71",
            hover_color="#27AE60"
        )
        self.start_button.pack(fill='x', padx=20, pady=5)
        
        self.stop_button = ctk.CTkButton(
            control_frame,
            text="Emergency Stop",
            command=self.emergency_stop,
            font=("Helvetica", 16, "bold"),
            height=40,
            fg_color="#E74C3C",
            hover_color="#C0392B",
            state="disabled"
        )
        self.stop_button.pack(fill='x', padx=20, pady=5)
        
        return panel
    
    def create_middle_panel(self, parent):
        panel = ctk.CTkFrame(parent)
        
        # Stats bar
        stats_frame = ctk.CTkFrame(panel)
        stats_frame.pack(fill='x', pady=(0,10))
        
        # P&L Display
        self.pnl_label = ctk.CTkLabel(
            stats_frame,
            text="P&L: ₹0.00",
            font=("Helvetica", 24, "bold"),
            text_color="#2ECC71"
        )
        self.pnl_label.pack(side='left', padx=20, pady=10)
        
        # Win Rate
        self.winrate_label = ctk.CTkLabel(
            stats_frame,
            text="Win Rate: 0%",
            font=("Helvetica", 24)
        )
        self.winrate_label.pack(side='right', padx=20, pady=10)
        
        # Chart area
        chart_frame = ctk.CTkFrame(panel)
        chart_frame.pack(fill='both', expand=True, pady=10)
        
        # Positions table
        positions_frame = ctk.CTkFrame(panel)
        positions_frame.pack(fill='x', pady=10)
        
        ctk.CTkLabel(
            positions_frame,
            text="Active Positions",
            font=("Helvetica", 18, "bold")
        ).pack(pady=10)
        
        cols = ("Symbol", "Entry", "Current", "P&L", "Strategy", "Duration")
        self.positions_tree = ttk.Treeview(
            positions_frame,
            columns=cols,
            show="headings",
            height=5
        )
        
        for col in cols:
            self.positions_tree.heading(col, text=col)
            self.positions_tree.column(col, width=100)
        
        self.positions_tree.pack(fill='x', padx=10, pady=5)
        
        return panel
    
    def create_right_panel(self, parent):
        panel = ctk.CTkFrame(parent)
        
        # Performance Metrics
        metrics_frame = ctk.CTkFrame(panel)
        metrics_frame.pack(fill='x', pady=(0,10))
        
        ctk.CTkLabel(
            metrics_frame,
            text="Performance Metrics",
            font=("Helvetica", 18, "bold")
        ).pack(pady=10)
        
        metrics = [
            ("Total Trades", "0"),
            ("Win Rate", "0%"),
            ("Avg Profit", "₹0.00"),
            ("Max Drawdown", "0%"),
            ("Sharpe Ratio", "0.00")
        ]
        
        self.metric_labels = {}
        for name, value in metrics:
            frame = ctk.CTkFrame(metrics_frame)
            frame.pack(fill='x', padx=10, pady=5)
            
            ctk.CTkLabel(
                frame,
                text=name,
                font=("Helvetica", 14)
            ).pack(side='left', padx=10)
            
            label = ctk.CTkLabel(
                frame,
                text=value,
                font=("Helvetica", 14, "bold")
            )
            label.pack(side='right', padx=10)
            
            self.metric_labels[name] = label
        
        # Trade Log
        log_frame = ctk.CTkFrame(panel)
        log_frame.pack(fill='both', expand=True, pady=10)
        
        ctk.CTkLabel(
            log_frame,
            text="Trade Log",
            font=("Helvetica", 18, "bold")
        ).pack(pady=10)
        
        self.trade_log = ctk.CTkTextbox(
            log_frame,
            height=400,
            font=("Consolas", 12)
        )
        self.trade_log.pack(fill='both', expand=True, padx=10, pady=5)
        
        return panel
    
    def update_strategy_params(self):
        # Clear existing parameters
        for widget in self.param_frame.winfo_children():
            widget.destroy()
        
        strategy = self.strategy_var.get()
        params = self.strategy_params[strategy]
        
        ctk.CTkLabel(
            self.param_frame,
            text="Strategy Parameters",
            font=("Helvetica", 18, "bold")
        ).pack(pady=10)
        
        # Create sliders for each parameter
        self.param_sliders = {}
        for param, value in params.items():
            frame = ctk.CTkFrame(self.param_frame)
            frame.pack(fill='x', padx=10, pady=5)
            
            ctk.CTkLabel(
                frame,
                text=param.replace('_', ' ').title()
            ).pack()
            
            slider = ctk.CTkSlider(
                frame,
                from_=0,
                to=100,
                number_of_steps=100
            )
            slider.pack(fill='x', padx=10, pady=5)
            
            self.param_sliders[param] = slider
    
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
        self.is_trading = False
        self.start_button.configure(
            text="Start Trading",
            fg_color="#2ECC71",
            hover_color="#27AE60"
        )
        self.stop_button.configure(state="disabled")
        self.log_message("Trading stopped normally")
    
    def emergency_stop(self):
        self.is_trading = False
        self.log_message("⚠️ EMERGENCY STOP - Closing all positions!")
        self.stop_trading()
    
    def run_strategy(self):
        while self.is_trading:
            time.sleep(2)
            self.update_stats()
    
    def update_stats(self):
        # Simulate trading activity
        self.pnl += np.random.normal(0, 100)
        self.trades_today += 1
        self.total_trades += 1
        self.win_rate = np.random.randint(40, 80)
        
        # Update labels
        self.pnl_label.configure(
            text=f"P&L: ₹{self.pnl:,.2f}",
            text_color="#2ECC71" if self.pnl >= 0 else "#E74C3C"
        )
        
        self.winrate_label.configure(text=f"Win Rate: {self.win_rate}%")
        
        # Update metrics
        self.metric_labels["Total Trades"].configure(text=str(self.total_trades))
        self.metric_labels["Win Rate"].configure(text=f"{self.win_rate}%")
        self.metric_labels["Avg Profit"].configure(text=f"₹{self.pnl/max(1,self.total_trades):,.2f}")
        
        # Log activity
        self.log_message(f"Trade executed at {datetime.now().strftime('%H:%M:%S')}")
    
    def log_message(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.trade_log.insert('end', f"[{timestamp}] {message}\n")
        self.trade_log.see('end')
    
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = AdvancedAlgoBot()
    app.run() 