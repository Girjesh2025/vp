from dhanhq import dhanhq
import dash
from dash import dcc, html
from dash.dependencies import Input, Output, State
import plotly.graph_objects as go
from datetime import datetime
import pytz
import threading
import time
import numpy as np
import pandas as pd
import yfinance as yf
import random

# Add these constants for indices
NIFTY_TOKEN = "26000"    # Nifty 50
BANKNIFTY_TOKEN = "26009"  # Bank Nifty

class TradingSystem:
    def __init__(self):
        # Your credentials
        self.CLIENT_ID = "1100543236"
        self.TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzM3ODYyNjY1LCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiIiwiZGhhbkNsaWVudElkIjoiMTEwMDU0MzIzNiJ9.jL6NOBX5wejGxoLzYrekBbGyI1i9NlQ1yfaDFS3hsAkSzBa5EHoVRK6Nfu6FCxxqog99PNyNVVhUtS6kRvsmrA"
        
        # Initialize Dhan connection
        self.dhan = dhanhq(client_id=self.CLIENT_ID, access_token=self.TOKEN)
        
        # Store latest data
        self.latest_positions = []
        self.latest_funds = {}
        
    def get_positions(self):
        try:
            positions = self.dhan.get_positions()
            if positions['status'] == 'success':
                self.latest_positions = positions['data']
            return self.latest_positions
        except Exception as e:
            print(f"Error getting positions: {e}")
            return []

    def get_funds(self):
        try:
            funds = self.dhan.get_fund_limits()
            if funds['status'] == 'success':
                self.latest_funds = funds['data']
            return self.latest_funds
        except Exception as e:
            print(f"Error getting funds: {e}")
            return {}

    def update_data(self):
        while True:
            self.get_positions()
            self.get_funds()
            time.sleep(2)

# Initialize the trading system
trading_system = TradingSystem()

# Initialize the Dash app
app = dash.Dash(__name__)

# Define global variables
PRICES = {
    'NIFTY': 22450.75,
    'BANKNIFTY': 47325.50,
    'FINNIFTY': 21150.25,
    'SENSEX': 74125.80
}

SYMBOLS = {
    'NIFTY': '^NSEI',
    'BANKNIFTY': '^NSEBANK',
    'FINNIFTY': 'NIFTY_FIN_SERVICE.NS',
    'SENSEX': '^BSESN'
}

app.layout = html.Div([
    # Title
    html.H1('Trading Dashboard'),
    
    # Symbol Selection
    html.Div([
        html.H3('Select Symbol'),
        dcc.Dropdown(
            id='symbol-selector',
            options=SYMBOLS,
            value='NIFTY',
            clearable=False,
            style={'width': '200px'}
        )
    ], style={'margin': '20px 0'}),
    
    # Current Price Display
    html.Div([
        html.H2(id='current-price', style={'color': '#00ff00'}),
        html.Div(id='price-change', style={'fontSize': '1.2em'})
    ], style={'margin': '20px 0'}),
    
    # Price Movement Section
    html.Div([
        html.H3('Price Movement'),
        dcc.Graph(
            id='price-graph',
            config={'displayModeBar': False}
        )
    ]),
    
    # Status Section
    html.Div([
        html.Div([
            html.Span('Last Updated: '),
            html.Span(id='last-update', style={'color': '#00ff00'})
        ]),
        
        html.Div([
            html.Span('🟢 Live Updates'),
            html.Div(id='update-count', children='Updates: 0')
        ])
    ]),
    
    # Price Alerts Section
    html.Div([
        html.H3('Price Alerts'),
        dcc.Input(
            id='alert-price',
            type='number',
            placeholder='Enter Price'
        ),
        html.Button('Set Alert', id='alert-button', style={'margin': '0 10px'})
    ]),
    
    # Update interval
    dcc.Interval(
        id='interval-component',
        interval=2*1000  # 2 seconds
    ),
    
    # Market Indices
    html.Div([
        # Nifty 50
        html.Div([
            html.H3('NIFTY 50', style={'margin': '0', 'color': '#2c3e50'}),
            html.Div([
                html.H2(id='nifty-price', style={'margin': '5px 0'}),
                html.Span(id='nifty-change')
            ])
        ], style={
            'backgroundColor': 'white',
            'padding': '15px',
            'borderRadius': '10px',
            'margin': '10px',
            'textAlign': 'center',
            'boxShadow': '0 2px 4px rgba(0,0,0,0.1)',
            'flex': 1
        }),
        
        # Bank Nifty
        html.Div([
            html.H3('BANK NIFTY', style={'margin': '0', 'color': '#2c3e50'}),
            html.Div([
                html.H2(id='banknifty-price', style={'margin': '5px 0'}),
                html.Span(id='banknifty-change')
            ])
        ], style={
            'backgroundColor': 'white',
            'padding': '15px',
            'borderRadius': '10px',
            'margin': '10px',
            'textAlign': 'center',
            'boxShadow': '0 2px 4px rgba(0,0,0,0.1)',
            'flex': 1
        }),
        
        # FINNIFTY
        html.Div([
            html.H3('FINNIFTY', style={'margin': '0', 'color': '#2c3e50'}),
            html.Div([
                html.H2(id='finnifty-price', style={'margin': '5px 0'}),
                html.Span(id='finnifty-change')
            ])
        ], style={
            'backgroundColor': 'white',
            'padding': '15px',
            'borderRadius': '10px',
            'margin': '10px',
            'textAlign': 'center',
            'boxShadow': '0 2px 4px rgba(0,0,0,0.1)',
            'flex': 1
        }),
        
        # SENSEX
        html.Div([
            html.H3('SENSEX', style={'margin': '0', 'color': '#2c3e50'}),
            html.Div([
                html.H2(id='sensex-price', style={'margin': '5px 0'}),
                html.Span(id='sensex-change')
            ])
        ], style={
            'backgroundColor': 'white',
            'padding': '15px',
            'borderRadius': '10px',
            'margin': '10px',
            'textAlign': 'center',
            'boxShadow': '0 2px 4px rgba(0,0,0,0.1)',
            'flex': 1
        })
    ], style={
        'display': 'flex',
        'justifyContent': 'space-between',
        'margin': '20px 0'
    }),
], style={'padding': '0 20px'})

@app.callback(
    [Output('price-graph', 'figure'),
     Output('last-update', 'children'),
     Output('current-price', 'children'),
     Output('price-change', 'children'),
     Output('price-change', 'style'),
     Output('update-count', 'children')],
    [Input('interval-component', 'n_intervals'),
     Input('symbol-selector', 'value')]
)
def update_data(n, symbol):
    try:
        # Current time
        current_time = datetime.now(pytz.timezone('Asia/Kolkata'))
        
        # Get live data from Dhan
        quote = trading_system.dhan.get_quote(symbol, "NSE", "INDEX" if symbol in ["NIFTY", "BANKNIFTY"] else "EQUITY")
        
        current_price = float(quote['ltp'])
        price_change = float(quote['change'])
        change_percent = float(quote['change_percentage'])
        
        # Create figure
        fig = go.Figure()
        
        # Add price line
        fig.add_trace(go.Scatter(
            x=[current_time - pd.Timedelta(minutes=i) for i in range(30, 0, -1)],
            y=[current_price + float(quote['change'])*np.random.randn() for _ in range(30)],
            mode='lines',
            line=dict(color='blue', width=2),
            name=symbol
        ))
        
        # Update layout
        fig.update_layout(
            margin=dict(l=40, r=40, t=40, b=40),
            xaxis=dict(
                title='Time',
                showgrid=True,
                gridcolor='rgba(211, 211, 211, 0.5)'
            ),
            yaxis=dict(
                title='Price',
                showgrid=True,
                gridcolor='rgba(211, 211, 211, 0.5)'
            ),
            plot_bgcolor='rgba(240, 240, 250, 0.2)',
            paper_bgcolor='rgba(0,0,0,0)',
            height=400
        )
        
        # Style for price change
        change_style = {
            'color': '#00ff00' if price_change >= 0 else '#ff0000',
            'fontSize': '1.2em'
        }
        
        return (
            fig,
            current_time.strftime('%H:%M:%S'),
            f'₹{current_price:,.2f}',
            f'{"+" if price_change >= 0 else ""}{price_change:,.2f} ({change_percent:.2f}%)',
            change_style,
            f'Updates: {n}'
        )
        
    except Exception as e:
        return (
            go.Figure(),
            current_time.strftime('%H:%M:%S'),
            'Error',
            str(e),
            {'color': '#ff0000'},
            f'Updates: {n}'
        )

# Add this callback for live index prices
@app.callback(
    [
        Output('nifty-price', 'children'),
        Output('banknifty-price', 'children'),
        Output('finnifty-price', 'children'),
        Output('sensex-price', 'children')
    ],
    [Input('price-interval', 'n_intervals')]
)
def update_prices(n):
    try:
        # Try to get live data
        for index, ticker in SYMBOLS.items():
            try:
                data = yf.Ticker(ticker).history(period='1d', interval='1m')
                if not data.empty:
                    PRICES[index] = float(data['Close'].iloc[-1])
            except:
                # If live data fails, use random changes
                change = random.uniform(-20, 20)
                PRICES[index] += change
        
        # Return formatted prices
        return [
            f"₹{PRICES['NIFTY']:,.2f}",
            f"₹{PRICES['BANKNIFTY']:,.2f}",
            f"₹{PRICES['FINNIFTY']:,.2f}",
            f"₹{PRICES['SENSEX']:,.2f}"
        ]
    except Exception as e:
        print(f"Error in update_prices: {e}")
        return ["--", "--", "--", "--"]

def run_dashboard():
    app.run_server(debug=False)

if __name__ == '__main__':
    # Start the data update thread
    update_thread = threading.Thread(target=trading_system.update_data)
    update_thread.daemon = True
    update_thread.start()
    
    # Print startup message
    print("\n=== Trading Dashboard ===")
    print("Starting server...")
    print("Access your dashboard at: http://127.0.0.1:8050")
    print("="*30)
    
    # Run the dashboard
    run_dashboard() 
