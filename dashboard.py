import dash
from dash import dcc, html, dash_table
from dash.dependencies import Input, Output
import plotly.express as px
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from datetime import datetime
import pytz

app = dash.Dash(__name__)

# Sample data
df = pd.DataFrame({
    "Time": pd.date_range(start="2023-01-01", periods=100, freq='T'),
    "Price": np.random.randn(100).cumsum()
})

fig = px.line(df, x="Time", y="Price", title="Price Movement")

app.layout = html.Div(children=[
    html.H1(children='Trading Dashboard'),

    dcc.Graph(
        id='price-graph',
        figure=fig
    ),

    # Add update status section
    html.Div([
        # Last Update Time
        html.Div([
            html.H4('Last Updated:', style={'display': 'inline-block', 'marginRight': '10px'}),
            html.Div(id='last-update-time', style={'display': 'inline-block', 'color': '#2ecc71'})
        ], style={'marginBottom': '10px'}),
        
        # Update Status Indicator
        html.Div([
            html.Div(id='update-status', className='status-indicator'),
            html.Div('Live Updates', style={'display': 'inline-block', 'marginLeft': '10px'})
        ]),
        
        # Data Refresh Counter
        html.Div(id='refresh-counter')
    ], style={'padding': '20px', 'backgroundColor': '#f8f9fa', 'borderRadius': '5px'}),
    
    dcc.Interval(
        id='interval-component',
        interval=2*1000,  # 2 seconds
        n_intervals=0
    ),

    # Add price alerts
    html.Div([
        html.H3('Price Alerts'),
        dcc.Input(id='alert-price', type='number', placeholder='Enter Price'),
        html.Button('Set Alert', id='set-alert-button')
    ])
])

# Add callback to update status
@app.callback(
    [Output('last-update-time', 'children'),
     Output('update-status', 'style'),
     Output('refresh-counter', 'children')],
    [Input('interval-component', 'n_intervals')]
)
def update_status(n):
    # Get current time in IST
    ist = pytz.timezone('Asia/Kolkata')
    current_time = datetime.now(ist).strftime('%H:%M:%S')
    
    # Status indicator style
    status_style = {
        'height': '10px',
        'width': '10px',
        'backgroundColor': '#2ecc71',  # Green for active
        'borderRadius': '50%',
        'display': 'inline-block',
        'animation': 'pulse 2s infinite'
    }
    
    # Update counter
    counter_text = f"Updates: {n}"
    
    return current_time, status_style, counter_text

# Add this CSS for the pulse animation
app.index_string = '''
<!DOCTYPE html>
<html>
    <head>
        {%metas%}
        <title>Trading Dashboard</title>
        {%favicon%}
        {%css%}
        <style>
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            .status-indicator {
                height: 10px;
                width: 10px;
                border-radius: 50%;
                display: inline-block;
            }
        </style>
    </head>
    <body>
        {%app_entry%}
        <footer>
            {%config%}
            {%scripts%}
            {%renderer%}
        </footer>
    </body>
</html>
'''

# Update your main callback to include real data verification
@app.callback(
    [Output('price-graph', 'figure'),
     Output('position-cards', 'children'),
     Output('account-summary', 'children')],
    [Input('interval-component', 'n_intervals')]
)
def update_dashboard(n):
    try:
        # Get real data
        positions, funds = get_live_trading_data()
        
        # Log update
        print(f"Update {n}: {datetime.now(pytz.timezone('Asia/Kolkata')).strftime('%H:%M:%S')}")
        print(f"Positions found: {len(positions['data']) if positions and positions['status'] == 'success' else 0}")
        
        # ... rest of your update code ...
        
    except Exception as e:
        print(f"Update error: {e}")
        
    return fig, position_cards, account_summary

if __name__ == '__main__':
    print("\n=== Trading Dashboard Started ===")
    print("Access URL: http://127.0.0.1:8050")
    print("Press Ctrl+C to stop the server")
    print("="*30)
    app.run_server(debug=True) 