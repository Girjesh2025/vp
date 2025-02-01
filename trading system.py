import tkinter as tk
import customtkinter as ctk
import numpy as np
from datetime import datetime
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import requests
import os

class OptimizedTradingBot:
    def __init__(self):
        self.root = ctk.CTk()
        self.root.title("🚀 Optimized Trading Bot")
        self.root.geometry("1400x900")

        # Set theme
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        # Initialize variables
        self.pnl = 0
        self.trades = 0
        self.win_rate = 0
        self.trade_data = []  # To store trade P&L
        self.is_trading = False
        self.current_instrument = "BANKNIFTY"
        self.current_price = 0

        # Credentials
        self.client_id = ""
        self.token = ""

        self.create_gui()

    def create_gui(self):
        # Main container
        self.container = ctk.CTkFrame(self.root, fg_color=("#1A1A2E", "#1A1A2E"))
        self.container.pack(fill='both', expand=True, padx=20, pady=20)

        # Create three panels
        self.create_left_panel()
        self.create_middle_panel()
        self.create_right_panel()
        self.create_credentials_panel()

    def create_left_panel(self):
        left_panel = ctk.CTkFrame(self.container, fg_color=("#16213E", "#16213E"))
        left_panel.pack(side='left', fill='y', padx=(0, 10))

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
            "AI/ML Strategy"
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

        # Instrument Info
        instrument_frame = ctk.CTkFrame(middle_panel, fg_color="#232D3F")
        instrument_frame.pack(fill='x', pady=10)

        self.instrument_label = ctk.CTkLabel(
            instrument_frame,
            text=f"Instrument: {self.current_instrument}",
            font=("Helvetica", 18, "bold"),
            text_color="#FFFFFF"
        )
        self.instrument_label.pack(pady=5)

        self.price_label = ctk.CTkLabel(
            instrument_frame,
            text=f"Current Price: ₹{self.current_price:.2f}",
            font=("Helvetica", 16),
            text_color="#4ECCA3"
        )
        self.price_label.pack(pady=5)

        # Chart Area
        chart_frame = ctk.CTkFrame(middle_panel, fg_color="#232D3F")
        chart_frame.pack(fill='both', expand=True, pady=10)

        ctk.CTkLabel(
            chart_frame,
            text="Performance Chart",
            font=("Helvetica", 20, "bold"),
            text_color="#FFFFFF"
        ).pack(pady=10)

        # Matplotlib figure
        self.fig, self.ax = plt.subplots(figsize=(8, 4))
        self.ax.plot([], [], color='#4ECCA3')
        self.ax.set_title("P&L Over Time", color='white')
        self.ax.set_facecolor("#232D3F")
        self.fig.patch.set_facecolor('#232D3F')
        self.ax.spines['top'].set_color('#FFFFFF')
        self.ax.spines['right'].set_color('#FFFFFF')
        self.ax.spines['bottom'].set_color('#FFFFFF')
        self.ax.spines['left'].set_color('#FFFFFF')
        self.ax.xaxis.label.set_color('#FFFFFF')
        self.ax.yaxis.label.set_color('#FFFFFF')
        self.ax.tick_params(axis='x', colors='white')
        self.ax.tick_params(axis='y', colors='white')

        canvas = FigureCanvasTkAgg(self.fig, master=chart_frame)
        canvas.get_tk_widget().pack(fill='both', expand=True)
        self.canvas = canvas

    def create_right_panel(self):
        right_panel = ctk.CTkFrame(self.container, fg_color=("#16213E", "#16213E"))
        right_panel.pack(side='left', fill='y', padx=(10, 0))

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

    def create_credentials_panel(self):
        credentials_frame = ctk.CTkFrame(self.container, fg_color=("#1A1A2E", "#1A1A2E"))
        credentials_frame.pack(fill='x', pady=10)

        ctk.CTkLabel(
            credentials_frame,
            text="Enter Your API Credentials",
            font=("Helvetica", 18, "bold"),
            text_color="#4ECCA3"
        ).pack(pady=5)

        ctk.CTkLabel(
            credentials_frame,
            text="Client ID",
            font=("Helvetica", 14),
            text_color="#FFFFFF"
        ).pack()

        self.client_id_entry = ctk.CTkEntry(
            credentials_frame,
            font=("Helvetica", 14),
            fg_color="#232D3F",
            text_color="#FFFFFF"
        )
        self.client_id_entry.pack(pady=5, padx=10, fill='x')

        ctk.CTkLabel(
            credentials_frame,
            text="Access Token",
            font=("Helvetica", 14),
            text_color="#FFFFFF"
        ).pack()

        self.token_entry = ctk.CTkEntry(
            credentials_frame,
            font=("Helvetica", 14),
            fg_color="#232D3F",
            text_color="#FFFFFF"
        )
        self.token_entry.pack(pady=5, padx=10, fill='x')

        ctk.CTkButton(
            credentials_frame,
            text="Save Credentials",
            command=self.save_credentials,
            font=("Helvetica", 14),
            fg_color="#4ECCA3",
            hover_color="#45B08C"
        ).pack(pady=10)

    def save_credentials(self):
        self.client_id = self.client_id_entry.get()
        self.token = self.token_entry.get()
        self.log_message("Credentials saved successfully!")

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

    def fetch_market_data(self, instrument="NIFTY"):
        if not self.token:
            self.log_message("Error: Access Token is not set.")
            return None

        endpoint = f"/marketdata/instruments/{instrument}"
        url = f"https://api.dhan.co{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.token}"
        }
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            return data
        else:
            self.log_message(f"Error fetching data: {response.status_code}")
            return None

    def simulate_trading(self):
        if self.is_trading:
            market_data = self.fetch_market_data(self.current_instrument)
            if market_data:
                self.current_price = market_data.get("lastPrice", 0)
                pnl_change = np.random.normal(100, 500)
                self.pnl += pnl_change
                self.trades += 1
                self.trade_data.append(self.pnl)

                # Update GUI
                self.update_performance_chart()
                self.instrument_label.configure(text=f"Instrument: {self.current_instrument}")
                self.price_label.configure(text=f"Current Price: ₹{self.current_price:.2f}")

                color = "#4ECCA3" if self.pnl >= 0 else "#E74C3C"
                self.log_message(f"Trade executed: ₹{pnl_change:+,.2f} | Last Price: ₹{self.current_price:.2f}")

                self.root.after(2000, self.simulate_trading)

    def update_performance_chart(self):
        self.ax.clear()
        self.ax.plot(self.trade_data, color='#4ECCA3')
        self.ax.set_title("P&L Over Time", color='white')
        self.canvas.draw()

    def log_message(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.trade_log.insert('end', f"[{timestamp}] {message}\n")
        self.trade_log.see('end')

    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = OptimizedTradingBot()
    app.run()
