import tkinter as tk
from tkinter import ttk
import pandas as pd
import numpy as np
import threading
import datetime
import time

class TradingDashboard:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("🚀 DHAN Algo Trading")
        self.root.geometry("1200x800")
        self.root.configure(bg="#1A1A2E")
        
        # Sample data for testing
        self.sample_stocks = [
            {"symbol": "RELIANCE", "ltp": "2456.75", "change": "+1.2%"},
            {"symbol": "TCS", "ltp": "3567.80", "change": "-0.5%"},
            {"symbol": "INFY", "ltp": "1876.45", "change": "+0.8%"},
            {"symbol": "HDFC", "ltp": "2789.30", "change": "+1.5%"},
            {"symbol": "ITC", "ltp": "456.75", "change": "-0.3%"}
        ]
        
        self.create_dashboard()
        
    def create_dashboard(self):
        # Create main frames
        self.create_top_frame()
        self.create_watchlist()
        self.create_charts()
        self.create_orders()
        self.create_controls()
        
        # Start updating (simulated for now)
        self.update_prices()
    
    def create_top_frame(self):
        """Create top statistics frame"""
        top_frame = tk.Frame(self.root, bg="#16213E", height=60)
        top_frame.pack(fill='x', padx=10, pady=5)
        
        # P&L Display
        self.pnl_label = tk.Label(
            top_frame,
            text="P&L: ₹15,750.25",
            font=("Helvetica", 16, "bold"),
            fg="#4ECCA3",
            bg="#16213E"
        )
        self.pnl_label.pack(side=tk.LEFT, padx=20)
        
        # Day's Change
        self.day_change = tk.Label(
            top_frame,
            text="Today: +2.3%",
            font=("Helvetica", 16),
            fg="#4ECCA3",
            bg="#16213E"
        )
        self.day_change.pack(side=tk.LEFT, padx=20)
    
    def create_watchlist(self):
        """Create watchlist panel"""
        watchlist_frame = tk.Frame(self.root, bg="#16213E")
        watchlist_frame.pack(side=tk.LEFT, fill='y', padx=10, pady=5)
        
        # Watchlist header
        tk.Label(
            watchlist_frame,
            text="Watchlist",
            font=("Helvetica", 14, "bold"),
            fg="#4ECCA3",
            bg="#16213E"
        ).pack(pady=10)
        
        # Create watchlist table
        self.watchlist = ttk.Treeview(
            watchlist_frame,
            columns=("Symbol", "LTP", "Change"),
            show="headings",
            height=20
        )
        
        # Define columns
        self.watchlist.heading("Symbol", text="Symbol")
        self.watchlist.heading("LTP", text="LTP")
        self.watchlist.heading("Change", text="Change")
        
        # Add sample data
        for stock in self.sample_stocks:
            self.watchlist.insert("", "end", values=(
                stock["symbol"],
                stock["ltp"],
                stock["change"]
            ))
            
        self.watchlist.pack(padx=5, pady=5)
    
    def create_charts(self):
        """Create charts area"""
        charts_frame = tk.Frame(self.root, bg="#16213E")
        charts_frame.pack(side=tk.LEFT, fill='both', expand=True, padx=10, pady=5)
        
        # Chart header
        tk.Label(
            charts_frame,
            text="Charts & Analysis",
            font=("Helvetica", 14, "bold"),
            fg="#4ECCA3",
            bg="#16213E"
        ).pack(pady=10)
        
        # Placeholder for charts
        chart_placeholder = tk.Canvas(
            charts_frame,
            bg="#1A1A2E",
            height=400
        )
        chart_placeholder.pack(fill='both', expand=True, padx=5, pady=5)
    
    def create_orders(self):
        """Create orders panel"""
        orders_frame = tk.Frame(self.root, bg="#16213E")
        orders_frame.pack(side=tk.BOTTOM, fill='x', padx=10, pady=5)
        
        # Orders header
        tk.Label(
            orders_frame,
            text="Orders & Positions",
            font=("Helvetica", 14, "bold"),
            fg="#4ECCA3",
            bg="#16213E"
        ).pack(pady=10)
        
        # Create orders table
        self.orders = ttk.Treeview(
            orders_frame,
            columns=("Time", "Symbol", "Type", "Qty", "Price", "Status"),
            show="headings",
            height=5
        )
        
        # Define columns
        for col in ("Time", "Symbol", "Type", "Qty", "Price", "Status"):
            self.orders.heading(col, text=col)
            
        self.orders.pack(padx=5, pady=5)
    
    def create_controls(self):
        """Create control panel"""
        control_frame = tk.Frame(self.root, bg="#16213E")
        control_frame.pack(side=tk.BOTTOM, fill='x', padx=10, pady=5)
        
        # Buy Button
        tk.Button(
            control_frame,
            text="BUY",
            command=self.place_buy_order,
            font=("Helvetica", 12, "bold"),
            bg="#4ECCA3",
            fg="white",
            width=10
        ).pack(side=tk.LEFT, padx=5, pady=5)
        
        # Sell Button
        tk.Button(
            control_frame,
            text="SELL",
            command=self.place_sell_order,
            font=("Helvetica", 12, "bold"),
            bg="#E94560",
            fg="white",
            width=10
        ).pack(side=tk.LEFT, padx=5, pady=5)
    
    def update_prices(self):
        """Simulate price updates"""
        for item in self.watchlist.get_children():
            current_values = self.watchlist.item(item)['values']
            # Simulate price change
            new_price = float(current_values[1].replace(",", ""))
            change = np.random.uniform(-0.5, 0.5)
            new_price *= (1 + change/100)
            
            self.watchlist.item(item, values=(
                current_values[0],
                f"{new_price:.2f}",
                f"{change:+.1f}%"
            ))
        
        # Update every second
        self.root.after(1000, self.update_prices)
    
    def place_buy_order(self):
        """Placeholder for buy order"""
        print("Buy order placed")
    
    def place_sell_order(self):
        """Placeholder for sell order"""
        print("Sell order placed")
    
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = TradingDashboard()
    app.run() 