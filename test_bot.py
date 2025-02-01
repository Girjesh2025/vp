import tkinter as tk
import customtkinter as ctk

class TestBot:
    def __init__(self):
        self.root = ctk.CTk()
        self.root.title("Test Bot")
        self.root.geometry("800x600")
        
        # Set theme
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")
        
        # Add a simple label
        label = ctk.CTkLabel(
            self.root,
            text="Test Bot Running",
            font=("Helvetica", 24, "bold")
        )
        label.pack(pady=20)
        
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = TestBot()
    app.run() 