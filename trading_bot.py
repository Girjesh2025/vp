import customtkinter as ctk
import tkinter as tk

class TradingBot:
    def __init__(self):
        self.root = ctk.CTk()
        self.root.title("Quantum Trading Bot")
        self.root.geometry("1200x800")
        
        # Set theme
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")
        
        # Create main layout
        self.create_gui()
        
    def create_gui(self):
        # Create main container
        container = ctk.CTkFrame(self.root)
        container.pack(fill='both', expand=True, padx=20, pady=20)
        
        # Top Stats Bar
        self.create_stats_bar(container)
        
        # Create three columns
        left_panel = self.create_left_panel(container)
        middle_panel = self.create_middle_panel(container)
        right_panel = self.create_right_panel(container)
        
    def create_stats_bar(self, parent):
        stats_frame = ctk.CTkFrame(parent)
        stats_frame.pack(fill='x', pady=(0,20))
        
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
            font=("Helvetica", 20)
        )
        self.winrate_label.pack(side='right', padx=20, pady=10)
        
    def create_left_panel(self, parent):
        left_panel = ctk.CTkFrame(parent)
        left_panel.pack(side='left', fill='y', padx=(0,10))
        
        # Strategy Selection
        ctk.CTkLabel(
            left_panel,
            text="Trading Strategy",
            font=("Helvetica", 20, "bold")
        ).pack(pady=10)
        
        strategies = [
            "VWAP Momentum",
            "Mean Reversion",
            "Breakout Trading",
            "Grid Trading"
        ]
        
        for strategy in strategies:
            ctk.CTkButton(
                left_panel,
                text=strategy,
                font=("Helvetica", 14),
                height=40,
                fg_color="#2C3E50",
                hover_color="#34495E"
            ).pack(padx=20, pady=5, fill='x')
        
        # Control Buttons
        ctk.CTkButton(
            left_panel,
            text="Start Trading",
            font=("Helvetica", 16, "bold"),
            height=50,
            fg_color="#2ECC71",
            hover_color="#27AE60"
        ).pack(padx=20, pady=20, fill='x')
        
        ctk.CTkButton(
            left_panel,
            text="Emergency Stop",
            font=("Helvetica", 16, "bold"),
            height=50,
            fg_color="#E74C3C",
            hover_color="#C0392B"
        ).pack(padx=20, pady=(0,20), fill='x')
        
        return left_panel
        
    def create_middle_panel(self, parent):
        middle_panel = ctk.CTkFrame(parent)
        middle_panel.pack(side='left', fill='both', expand=True, padx=10)
        
        # Chart Area (placeholder)
        chart_frame = ctk.CTkFrame(middle_panel, height=400)
        chart_frame.pack(fill='x', pady=(0,20))
        
        ctk.CTkLabel(
            chart_frame,
            text="Chart Area",
            font=("Helvetica", 24, "bold")
        ).pack(pady=100)
        
        # Order Book
        order_frame = ctk.CTkFrame(middle_panel)
        order_frame.pack(fill='both', expand=True)
        
        ctk.CTkLabel(
            order_frame,
            text="Order Book",
            font=("Helvetica", 20, "bold")
        ).pack(pady=10)
        
        return middle_panel
        
    def create_right_panel(self, parent):
        right_panel = ctk.CTkFrame(parent)
        right_panel.pack(side='left', fill='y', padx=(10,0))
        
        # Performance Metrics
        ctk.CTkLabel(
            right_panel,
            text="Performance",
            font=("Helvetica", 20, "bold")
        ).pack(pady=10)
        
        metrics = [
            ("Total Trades", "0"),
            ("Win Rate", "0%"),
            ("Avg Profit", "₹0.00"),
            ("Max Drawdown", "0%")
        ]
        
        for label, value in metrics:
            metric_frame = ctk.CTkFrame(right_panel)
            metric_frame.pack(fill='x', padx=20, pady=5)
            
            ctk.CTkLabel(
                metric_frame,
                text=label,
                font=("Helvetica", 14)
            ).pack(pady=5)
            
            ctk.CTkLabel(
                metric_frame,
                text=value,
                font=("Helvetica", 16, "bold")
            ).pack(pady=5)
        
        return right_panel
    
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = TradingBot()
    app.run()