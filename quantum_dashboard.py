if __name__ == '__main__':
    try:
        print("\n=== Quantum Trading Pro ===")
        print("Starting server...")
        # Try different ports
        for port in [8051, 8052, 8053, 8054, 8055]:
            try:
                print(f"Trying port {port}...")
                print(f"Access your dashboard at: http://127.0.0.1:{port}")
                print("="*30)
                app.run_server(debug=True, port=port)
                break
            except:
                continue
    except Exception as e:
        print(f"Error: {str(e)}") 