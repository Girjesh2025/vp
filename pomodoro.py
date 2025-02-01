import tkinter as tk
from tkinter import ttk

class PomodoroTimer:
    def __init__(self):
        self.window = tk.Tk()
        self.window.title("Pomodoro")
        self.window.geometry("300x400")  # Set window size
        
        # Timer variables
        self.minutes = 25
        self.seconds = 0
        self.running = False
        
        # Timer display
        self.label = ttk.Label(self.window, text="25:00", font=("Arial", 50))
        self.label.pack(pady=20)
        
        # Buttons
        ttk.Button(self.window, text="Start", command=self.start).pack(pady=5)
        ttk.Button(self.window, text="Stop", command=self.stop).pack(pady=5)
        ttk.Button(self.window, text="Reset", command=self.reset).pack(pady=5)

    def start(self):
        if not self.running:
            self.running = True
            self.countdown()

    def stop(self):
        self.running = False

    def reset(self):
        self.running = False
        self.minutes = 25
        self.seconds = 0
        self.label.config(text="25:00")

    def countdown(self):
        if self.running:
            if self.seconds == 0:
                if self.minutes == 0:
                    self.running = False
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
    app = PomodoroTimer()
    app.run()
