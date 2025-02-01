import dash
from dash import html, dcc
from dash.dependencies import Input, Output
from datetime import datetime
import pytz
import random  # For sample data

app = dash.Dash(__name__)

# Color scheme
COLORS = {
    'bg': '#000000',
    'card_bg': '#111111',
    'green': '#00ff00',
    'red': '#ff4444',
    'white': '#ffffff',
    'gray': '#888888',
    'blue': '#0088ff'
}

def get_sample_data():
    return {
        'nifty': 19788.14 + random.uniform(-10, 10),
        'banknifty': 44560.43 + random.uniform(-20, 20),
        'sensex': 66881.60 + random.uniform(-30, 30)
    }

app.layout = html.Div([
    # Header
    html.Div([
        html.H1('Trading Dashboard 📈', 
                style={'color': COLORS['white'], 'margin': '0'}),
        html.Div([
            html.Span('Market Status: ', 
                     style={'color': COLORS['gray']}),
            html.Span('🟢 Live', 
                     style={'color': COLORS['green']})
        ], style={'marginTop': '10px'})
    ], style={'textAlign': 'center', 'marginBottom': '30px'}),
    
    # Time Display
    html.H2(id='time-display', 
            style={'color': COLORS['blue'], 
                   'textAlign': 'center', 
                   'marginBottom': '40px'}),
    
    # Market Indices
    html.Div([
        # NIFTY 50
        html.Div([
            html.H3('NIFTY 50', 
                    style={'color': COLORS['gray'], 
                          'marginBottom': '10px'}),
            html.H2(id='nifty-price', 
                    style={'color': COLORS['white'], 
                          'margin': '5px'}),
            html.H4(id='nifty-change', 
                    style={'margin': '5px'})
        ], style={'backgroundColor': COLORS['card_bg'], 
                 'padding': '20px', 
                 'borderRadius': '10px', 
                 'margin': '10px',
                 'minWidth': '200px',
                 'transition': 'transform 0.2s',
                 'cursor': 'pointer'}),
        
        # BANK NIFTY
        html.Div([
            html.H3('BANK NIFTY', 
                    style={'color': COLORS['gray'], 
                          'marginBottom': '10px'}),
            html.H2(id='banknifty-price', 
                    style={'color': COLORS['white'], 
                          'margin': '5px'}),
            html.H4(id='banknifty-change', 
                    style={'margin': '5px'})
        ], style={'backgroundColor': COLORS['card_bg'], 
                 'padding': '20px', 
                 'borderRadius': '10px', 
                 'margin': '10px',
                 'minWidth': '200px',
                 'transition': 'transform 0.2s',
                 'cursor': 'pointer'}),
        
        # SENSEX
        html.Div([
            html.H3('SENSEX', 
                    style={'color': COLORS['gray'], 
                          'marginBottom': '10px'}),
            html.H2(id='sensex-price', 
                    style={'color': COLORS['white'], 
                          'margin': '5px'}),
            html.H4(id='sensex-change', 
                    style={'margin': '5px'})
        ], style={'backgroundColor': COLORS['card_bg'], 
                 'padding': '20px', 
                 'borderRadius': '10px', 
                 'margin': '10px',
                 'minWidth': '200px',
                 'transition': 'transform 0.2s',
                 'cursor': 'pointer'})
    ], style={'display': 'flex', 
              'justifyContent': 'center', 
              'flexWrap': 'wrap'}),
    
    dcc.Interval(
        id='interval-component',
        interval=1000
    )
], style={
    'backgroundColor': COLORS['bg'],
    'padding': '20px',
    'minHeight': '100vh',
    'fontFamily': 'Arial'
})

@app.callback(
    [Output('time-display', 'children'),
     Output('nifty-price', 'children'),
     Output('nifty-change', 'children'),
     Output('nifty-change', 'style'),
     Output('banknifty-price', 'children'),
     Output('banknifty-change', 'children'),
     Output('banknifty-change', 'style'),
     Output('sensex-price', 'children'),
     Output('sensex-change', 'children'),
     Output('sensex-change', 'style')],
    Input('interval-component', 'n_intervals')
)
def update_data(n):
    current_time = datetime.now(pytz.timezone('Asia/Kolkata'))
    data = get_sample_data()
    
    # Calculate changes
    changes = {
        'nifty': random.uniform(-0.5, 0.5),
        'banknifty': random.uniform(-0.5, 0.5),
        'sensex': random.uniform(-0.5, 0.5)
    }
    
    # Style for changes
    def get_change_style(change):
        return {
            'color': COLORS['green'] if change >= 0 else COLORS['red'],
            'margin': '5px',
            'fontSize': '16px'
        }
    
    return (
        f"🕒 {current_time.strftime('%H:%M:%S')}",
        f"₹{data['nifty']:,.2f}",
        f"({'+' if changes['nifty'] >= 0 else ''}{changes['nifty']:.2f}%)",
        get_change_style(changes['nifty']),
        f"₹{data['banknifty']:,.2f}",
        f"({'+' if changes['banknifty'] >= 0 else ''}{changes['banknifty']:.2f}%)",
        get_change_style(changes['banknifty']),
        f"₹{data['sensex']:,.2f}",
        f"({'+' if changes['sensex'] >= 0 else ''}{changes['sensex']:.2f}%)",
        get_change_style(changes['sensex'])
    )

if __name__ == '__main__':
    print("\n=== Trading Dashboard ===")
    print("Starting server...")
    print("Go to: http://127.0.0.1:8060")
    print("="*30)
    app.run_server(port=8060)
