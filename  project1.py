import tkinter as tk
from tkinter import ttk
import time
from datetime import datetime

class ModernPomodoroTimer:
    def __init__(self):
        self.window = tk.Tk()
        self.window.title("✨ Pomodoro Timer ✨")
        self.window.geometry("500x700")
        self.window.configure(bg="#1A1A2E")
        
        # Timer variables
        self.minutes = 25
        self.seconds = 0
        self.running = False
        self.session_count = 0
        
        # Create main container
        main_container = tk.Frame(self.window, bg="#1A1A2E", padx=20, pady=20)
        main_container.pack(expand=True, fill='both')
        
        # Title
        title_label = tk.Label(
            main_container,
            text="Focus Timer",
            font=("Helvetica", 24, "bold"),
            fg="#FF6B6B",
            bg="#1A1A2E"
        )
        title_label.pack(pady=(0, 20))
        
        # Timer display container
        timer_frame = tk.Frame(main_container, bg="#16213E", padx=30, pady=30)
        timer_frame.pack(fill='x', pady=20)
        
        # Timer display
        self.label = tk.Label(
            timer_frame,
            text="25:00",
            font=("Helvetica", 85, "bold"),
            fg="#4ECCA3",
            bg="#16213E"
        )
        self.label.pack()
        
        # Session counter
        self.session_label = tk.Label(
            main_container,
            text="✨ Sessions Completed: 0 ✨",
            font=("Helvetica", 16),
            fg="#E94560",
            bg="#1A1A2E"
        )
        self.session_label.pack(pady=20)
        
        # Status message
        self.status = tk.Label(
            main_container,
            text="Ready to achieve greatness! 🚀",
            font=("Helvetica", 14),
            fg="#4ECCA3",
            bg="#1A1A2E"
        )
        self.status.pack(pady=10)
        
        # Main buttons frame
        button_frame = tk.Frame(main_container, bg="#1A1A2E")
        button_frame.pack(pady=30)
        
        # Main control buttons with black text
        button_configs = [
            ("START", "#4ECCA3", self.start, "▶️"),
            ("STOP", "#E94560", self.stop, "⏸️"),
            ("RESET", "#FFD93D", self.reset, "🔄")
        ]
        
        for text, color, command, emoji in button_configs:
            btn_frame = tk.Frame(button_frame, bg=color, padx=2, pady=2)
            btn_frame.pack(side=tk.LEFT, padx=15)
            
            btn = tk.Button(
                btn_frame,
                text=f"{emoji} {text}",
                font=("Helvetica", 16, "bold"),
                width=10,
                height=2,
                bg=color,
                fg="black",  # Changed to black text
                command=command,
                relief="flat",
                borderwidth=0
            )
            btn.pack()
            
            # Hover effects
            btn.bind("<Enter>", lambda e, b=btn: b.config(bg=self.lighten_color(b.cget("bg"))))
            btn.bind("<Leave>", lambda e, b=btn, c=color: b.config(bg=c))
        
        # Time selection frame
        time_frame = tk.Frame(main_container, bg="#1A1A2E")
        time_frame.pack(pady=30)
        
        # Quick select time buttons with black text
        time_buttons = [
            ("25 min", 25, "🎯"),
            ("15 min", 15, "⚡"),
            ("5 min", 5, "☕")
        ]
        
        for text, mins, emoji in time_buttons:
            btn = tk.Button(
                time_frame,
                text=f"{emoji} {text}",
                font=("Helvetica", 12, "bold"),
                width=10,
                height=1,
                bg="#533483",
                fg="black",  # Changed to black text
                command=lambda m=mins: self.set_time(m),
                relief="flat",
                borderwidth=0
            )
            btn.pack(side=tk.LEFT, padx=10)
            
            # Hover effects
            btn.bind("<Enter>", lambda e, b=btn: b.config(bg="#6B44AC"))
            btn.bind("<Leave>", lambda e, b=btn: b.config(bg="#533483"))
        
        # Motivational quote
        self.quote_label = tk.Label(
            main_container,
            text="\"The only bad workout is the one that didn't happen.\" 💪",
            font=("Helvetica", 12, "italic"),
            fg="#FFD93D",
            bg="#1A1A2E",
            wraplength=400
        )
        self.quote_label.pack(pady=30)

    def lighten_color(self, color):
        if color == "#4ECCA3": return "#65E5B9"
        if color == "#E94560": return "#F15E78"
        if color == "#FFD93D": return "#FFE160"
        return color

    def set_time(self, minutes):
        if not self.running:
            self.minutes = minutes
            self.seconds = 0
            self.label.config(text=f"{minutes:02d}:00")
            self.status.config(text="Timer Set! Let's do this! 🎯")

    def start(self):
        if not self.running:
            self.running = True
            self.status.config(text="Stay focused, you're doing great! 💪")
            self.countdown()

    def stop(self):
        self.running = False
        self.status.config(text="Taking a breather... 😌")

    def reset(self):
        self.running = False
        self.minutes = 25
        self.seconds = 0
        self.label.config(text="25:00")
        self.status.config(text="Fresh start! Ready to go! ⚡")

    def countdown(self):
        if self.running:
            if self.seconds == 0:
                if self.minutes == 0:
                    self.running = False
                    self.session_count += 1
                    self.session_label.config(text=f"✨ Sessions Completed: {self.session_count} ✨")
                    self.status.config(text="Great work! Time for a break! 🎉")
                    return
                self.minutes -= 1
                self.seconds = 59
            else:
                self.seconds -= 1
            
            self.label.config(text=f"{self.minutes:02d}:{self.seconds:02d}")
            self.window.after(1000, self.countdown)

    def run(self):
        self.window.mainloop()

if __name__ == "__main__":
    app = ModernPomodoroTimer()
    app.run()