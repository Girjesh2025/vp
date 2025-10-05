// Comprehensive NSE and BSE Stock Database
export interface StockInfo {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  sector?: string;
  marketCap?: 'Large' | 'Mid' | 'Small';
}

export const stockDatabase: StockInfo[] = [
  // NSE Large Cap Stocks (Top 100 by Market Cap)
  { symbol: 'RELIANCE', name: 'Reliance Industries Limited', exchange: 'NSE', sector: 'Oil & Gas', marketCap: 'Large' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', sector: 'IT Services', marketCap: 'Large' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', exchange: 'NSE', sector: 'Banking', marketCap: 'Large' },
  { symbol: 'INFY', name: 'Infosys Limited', exchange: 'NSE', sector: 'IT Services', marketCap: 'Large' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', exchange: 'NSE', sector: 'Banking', marketCap: 'Large' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Limited', exchange: 'NSE', sector: 'FMCG', marketCap: 'Large' },
  { symbol: 'ITC', name: 'ITC Limited', exchange: 'NSE', sector: 'FMCG', marketCap: 'Large' },
  { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', sector: 'Banking', marketCap: 'Large' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', exchange: 'NSE', sector: 'Telecom', marketCap: 'Large' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Limited', exchange: 'NSE', sector: 'Banking', marketCap: 'Large' },
  { symbol: 'LT', name: 'Larsen & Toubro Limited', exchange: 'NSE', sector: 'Engineering', marketCap: 'Large' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Limited', exchange: 'NSE', sector: 'Paints', marketCap: 'Large' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Large' },
  { symbol: 'AXISBANK', name: 'Axis Bank Limited', exchange: 'NSE', sector: 'Banking', marketCap: 'Large' },
  { symbol: 'TITAN', name: 'Titan Company Limited', exchange: 'NSE', sector: 'Jewellery', marketCap: 'Large' },
  { symbol: 'NESTLEIND', name: 'Nestle India Limited', exchange: 'NSE', sector: 'FMCG', marketCap: 'Large' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Limited', exchange: 'NSE', sector: 'Cement', marketCap: 'Large' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Limited', exchange: 'NSE', sector: 'NBFC', marketCap: 'Large' },
  { symbol: 'WIPRO', name: 'Wipro Limited', exchange: 'NSE', sector: 'IT Services', marketCap: 'Large' },
  { symbol: 'TECHM', name: 'Tech Mahindra Limited', exchange: 'NSE', sector: 'IT Services', marketCap: 'Large' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports and Special Economic Zone Limited', exchange: 'NSE', sector: 'Infrastructure', marketCap: 'Large' },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Limited', exchange: 'NSE', sector: 'Healthcare', marketCap: 'Large' },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Large' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Limited', exchange: 'NSE', sector: 'Financial Services', marketCap: 'Large' },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corporation Limited', exchange: 'NSE', sector: 'Oil & Gas', marketCap: 'Large' },
  { symbol: 'BRITANNIA', name: 'Britannia Industries Limited', exchange: 'NSE', sector: 'FMCG', marketCap: 'Large' },
  { symbol: 'CIPLA', name: 'Cipla Limited', exchange: 'NSE', sector: 'Pharmaceuticals', marketCap: 'Large' },
  { symbol: 'COALINDIA', name: 'Coal India Limited', exchange: 'NSE', sector: 'Mining', marketCap: 'Large' },
  { symbol: 'DIVISLAB', name: 'Divi\'s Laboratories Limited', exchange: 'NSE', sector: 'Pharmaceuticals', marketCap: 'Large' },
  { symbol: 'DRREDDY', name: 'Dr. Reddy\'s Laboratories Limited', exchange: 'NSE', sector: 'Pharmaceuticals', marketCap: 'Large' },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Large' },
  { symbol: 'GRASIM', name: 'Grasim Industries Limited', exchange: 'NSE', sector: 'Cement', marketCap: 'Large' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Limited', exchange: 'NSE', sector: 'IT Services', marketCap: 'Large' },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Large' },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Limited', exchange: 'NSE', sector: 'Metals', marketCap: 'Large' },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Limited', exchange: 'NSE', sector: 'Banking', marketCap: 'Large' },
  { symbol: 'IOC', name: 'Indian Oil Corporation Limited', exchange: 'NSE', sector: 'Oil & Gas', marketCap: 'Large' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Limited', exchange: 'NSE', sector: 'Steel', marketCap: 'Large' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Large' },
  { symbol: 'NTPC', name: 'NTPC Limited', exchange: 'NSE', sector: 'Power', marketCap: 'Large' },
  { symbol: 'ONGC', name: 'Oil and Natural Gas Corporation Limited', exchange: 'NSE', sector: 'Oil & Gas', marketCap: 'Large' },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Limited', exchange: 'NSE', sector: 'Power', marketCap: 'Large' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Limited', exchange: 'NSE', sector: 'Pharmaceuticals', marketCap: 'Large' },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products Limited', exchange: 'NSE', sector: 'FMCG', marketCap: 'Large' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Large' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Limited', exchange: 'NSE', sector: 'Steel', marketCap: 'Large' },
  { symbol: 'UPL', name: 'UPL Limited', exchange: 'NSE', sector: 'Chemicals', marketCap: 'Large' },
  { symbol: 'VEDL', name: 'Vedanta Limited', exchange: 'NSE', sector: 'Metals', marketCap: 'Large' },
  { symbol: 'SAIL', name: 'Steel Authority of India Limited', exchange: 'NSE', sector: 'Steel', marketCap: 'Large' },
  { symbol: 'NMDC', name: 'NMDC Limited', exchange: 'NSE', sector: 'Mining', marketCap: 'Large' },
  { symbol: 'GAIL', name: 'GAIL (India) Limited', exchange: 'NSE', sector: 'Oil & Gas', marketCap: 'Large' },
  { symbol: 'PETRONET', name: 'Petronet LNG Limited', exchange: 'NSE', sector: 'Oil & Gas', marketCap: 'Large' },
  { symbol: 'INDIGO', name: 'InterGlobe Aviation Limited', exchange: 'NSE', sector: 'Aviation', marketCap: 'Large' },

  // NSE Mid Cap Stocks
  { symbol: 'ADANIGREEN', name: 'Adani Green Energy Limited', exchange: 'NSE', sector: 'Renewable Energy', marketCap: 'Mid' },
  { symbol: 'ADANITRANS', name: 'Adani Transmission Limited', exchange: 'NSE', sector: 'Power Transmission', marketCap: 'Mid' },
  { symbol: 'AMBUJACEM', name: 'Ambuja Cements Limited', exchange: 'NSE', sector: 'Cement', marketCap: 'Mid' },
  { symbol: 'AUBANK', name: 'AU Small Finance Bank Limited', exchange: 'NSE', sector: 'Banking', marketCap: 'Mid' },
  { symbol: 'BANDHANBNK', name: 'Bandhan Bank Limited', exchange: 'NSE', sector: 'Banking', marketCap: 'Mid' },
  { symbol: 'BERGEPAINT', name: 'Berger Paints India Limited', exchange: 'NSE', sector: 'Paints', marketCap: 'Mid' },
  { symbol: 'BIOCON', name: 'Biocon Limited', exchange: 'NSE', sector: 'Pharmaceuticals', marketCap: 'Mid' },
  { symbol: 'BOSCHLTD', name: 'Bosch Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Mid' },
  { symbol: 'CADILAHC', name: 'Cadila Healthcare Limited', exchange: 'NSE', sector: 'Pharmaceuticals', marketCap: 'Mid' },
  { symbol: 'CANBK', name: 'Canara Bank', exchange: 'NSE', sector: 'Banking', marketCap: 'Mid' },
  { symbol: 'CHOLAFIN', name: 'Cholamandalam Investment and Finance Company Limited', exchange: 'NSE', sector: 'NBFC', marketCap: 'Mid' },
  { symbol: 'COLPAL', name: 'Colgate Palmolive (India) Limited', exchange: 'NSE', sector: 'FMCG', marketCap: 'Mid' },
  { symbol: 'CONCOR', name: 'Container Corporation of India Limited', exchange: 'NSE', sector: 'Logistics', marketCap: 'Mid' },
  { symbol: 'CUMMINSIND', name: 'Cummins India Limited', exchange: 'NSE', sector: 'Engineering', marketCap: 'Mid' },
  { symbol: 'DABUR', name: 'Dabur India Limited', exchange: 'NSE', sector: 'FMCG', marketCap: 'Mid' },
  { symbol: 'DALBHARAT', name: 'Dalmia Bharat Limited', exchange: 'NSE', sector: 'Cement', marketCap: 'Mid' },
  { symbol: 'FEDERALBNK', name: 'Federal Bank Limited', exchange: 'NSE', sector: 'Banking', marketCap: 'Mid' },
  { symbol: 'GLENMARK', name: 'Glenmark Pharmaceuticals Limited', exchange: 'NSE', sector: 'Pharmaceuticals', marketCap: 'Mid' },
  { symbol: 'GODREJCP', name: 'Godrej Consumer Products Limited', exchange: 'NSE', sector: 'FMCG', marketCap: 'Mid' },
  { symbol: 'GODREJPROP', name: 'Godrej Properties Limited', exchange: 'NSE', sector: 'Real Estate', marketCap: 'Mid' },
  { symbol: 'HAVELLS', name: 'Havells India Limited', exchange: 'NSE', sector: 'Consumer Durables', marketCap: 'Mid' },
  { symbol: 'HDFCAMC', name: 'HDFC Asset Management Company Limited', exchange: 'NSE', sector: 'Asset Management', marketCap: 'Mid' },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Company Limited', exchange: 'NSE', sector: 'Insurance', marketCap: 'Mid' },
  { symbol: 'ICICIGI', name: 'ICICI Lombard General Insurance Company Limited', exchange: 'NSE', sector: 'Insurance', marketCap: 'Mid' },
  { symbol: 'ICICIPRULI', name: 'ICICI Prudential Life Insurance Company Limited', exchange: 'NSE', sector: 'Insurance', marketCap: 'Mid' },
  { symbol: 'IDEA', name: 'Vodafone Idea Limited', exchange: 'NSE', sector: 'Telecom', marketCap: 'Mid' },
  { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank Limited', exchange: 'NSE', sector: 'Banking', marketCap: 'Mid' },
  { symbol: 'INDHOTEL', name: 'The Indian Hotels Company Limited', exchange: 'NSE', sector: 'Hotels', marketCap: 'Mid' },
  { symbol: 'JINDALSTEL', name: 'Jindal Steel & Power Limited', exchange: 'NSE', sector: 'Steel', marketCap: 'Mid' },
  { symbol: 'JUBLFOOD', name: 'Jubilant FoodWorks Limited', exchange: 'NSE', sector: 'Food Services', marketCap: 'Mid' },
  { symbol: 'LICHSGFIN', name: 'LIC Housing Finance Limited', exchange: 'NSE', sector: 'Housing Finance', marketCap: 'Mid' },
  { symbol: 'LUPIN', name: 'Lupin Limited', exchange: 'NSE', sector: 'Pharmaceuticals', marketCap: 'Mid' },
  { symbol: 'MARICO', name: 'Marico Limited', exchange: 'NSE', sector: 'FMCG', marketCap: 'Mid' },
  { symbol: 'MCDOWELL-N', name: 'United Spirits Limited', exchange: 'NSE', sector: 'Beverages', marketCap: 'Mid' },
  { symbol: 'MFSL', name: 'Max Financial Services Limited', exchange: 'NSE', sector: 'Insurance', marketCap: 'Mid' },
  { symbol: 'MGL', name: 'Mahanagar Gas Limited', exchange: 'NSE', sector: 'Gas Distribution', marketCap: 'Mid' },
  { symbol: 'MOTHERSUMI', name: 'Motherson Sumi Systems Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Mid' },
  { symbol: 'MPHASIS', name: 'Mphasis Limited', exchange: 'NSE', sector: 'IT Services', marketCap: 'Mid' },
  { symbol: 'MRF', name: 'MRF Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Mid' },
  { symbol: 'MUTHOOTFIN', name: 'Muthoot Finance Limited', exchange: 'NSE', sector: 'NBFC', marketCap: 'Mid' },
  { symbol: 'NAUKRI', name: 'Info Edge (India) Limited', exchange: 'NSE', sector: 'Internet', marketCap: 'Mid' },
  { symbol: 'OBEROIRLTY', name: 'Oberoi Realty Limited', exchange: 'NSE', sector: 'Real Estate', marketCap: 'Mid' },
  { symbol: 'OFSS', name: 'Oracle Financial Services Software Limited', exchange: 'NSE', sector: 'IT Services', marketCap: 'Mid' },
  { symbol: 'PAGEIND', name: 'Page Industries Limited', exchange: 'NSE', sector: 'Textiles', marketCap: 'Mid' },
  { symbol: 'PEL', name: 'Piramal Enterprises Limited', exchange: 'NSE', sector: 'Pharmaceuticals', marketCap: 'Mid' },
  { symbol: 'PERSISTENT', name: 'Persistent Systems Limited', exchange: 'NSE', sector: 'IT Services', marketCap: 'Mid' },
  { symbol: 'PIDILITIND', name: 'Pidilite Industries Limited', exchange: 'NSE', sector: 'Chemicals', marketCap: 'Mid' },
  { symbol: 'PIIND', name: 'PI Industries Limited', exchange: 'NSE', sector: 'Chemicals', marketCap: 'Mid' },
  { symbol: 'PNB', name: 'Punjab National Bank', exchange: 'NSE', sector: 'Banking', marketCap: 'Mid' },
  { symbol: 'POLYCAB', name: 'Polycab India Limited', exchange: 'NSE', sector: 'Cables', marketCap: 'Mid' },
  { symbol: 'PVR', name: 'PVR Limited', exchange: 'NSE', sector: 'Entertainment', marketCap: 'Mid' },
  { symbol: 'RAMCOCEM', name: 'The Ramco Cements Limited', exchange: 'NSE', sector: 'Cement', marketCap: 'Mid' },
  { symbol: 'RBLBANK', name: 'RBL Bank Limited', exchange: 'NSE', sector: 'Banking', marketCap: 'Mid' },
  { symbol: 'RECLTD', name: 'REC Limited', exchange: 'NSE', sector: 'Financial Services', marketCap: 'Mid' },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Company Limited', exchange: 'NSE', sector: 'Insurance', marketCap: 'Mid' },
  { symbol: 'SHREECEM', name: 'Shree Cement Limited', exchange: 'NSE', sector: 'Cement', marketCap: 'Mid' },
  { symbol: 'SIEMENS', name: 'Siemens Limited', exchange: 'NSE', sector: 'Engineering', marketCap: 'Mid' },
  { symbol: 'SRF', name: 'SRF Limited', exchange: 'NSE', sector: 'Chemicals', marketCap: 'Mid' },
  { symbol: 'SRTRANSFIN', name: 'Shriram Transport Finance Company Limited', exchange: 'NSE', sector: 'NBFC', marketCap: 'Mid' },
  { symbol: 'TORNTPHARM', name: 'Torrent Pharmaceuticals Limited', exchange: 'NSE', sector: 'Pharmaceuticals', marketCap: 'Mid' },
  { symbol: 'TORNTPOWER', name: 'Torrent Power Limited', exchange: 'NSE', sector: 'Power', marketCap: 'Mid' },
  { symbol: 'TRENT', name: 'Trent Limited', exchange: 'NSE', sector: 'Retail', marketCap: 'Mid' },
  { symbol: 'TVSMOTOR', name: 'TVS Motor Company Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Mid' },
  { symbol: 'UJJIVAN', name: 'Ujjivan Financial Services Limited', exchange: 'NSE', sector: 'NBFC', marketCap: 'Mid' },

  // NSE Small Cap Stocks
  { symbol: 'AAVAS', name: 'Aavas Financiers Limited', exchange: 'NSE', sector: 'Housing Finance', marketCap: 'Small' },
  { symbol: 'ABCAPITAL', name: 'Aditya Birla Capital Limited', exchange: 'NSE', sector: 'Financial Services', marketCap: 'Small' },
  { symbol: 'ABFRL', name: 'Aditya Birla Fashion and Retail Limited', exchange: 'NSE', sector: 'Retail', marketCap: 'Small' },
  { symbol: 'AFFLE', name: 'Affle (India) Limited', exchange: 'NSE', sector: 'Digital Marketing', marketCap: 'Small' },
  { symbol: 'ALKEM', name: 'Alkem Laboratories Limited', exchange: 'NSE', sector: 'Pharmaceuticals', marketCap: 'Small' },
  { symbol: 'AMARAJABAT', name: 'Amara Raja Batteries Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Small' },
  { symbol: 'ASTRAL', name: 'Astral Limited', exchange: 'NSE', sector: 'Building Materials', marketCap: 'Small' },
  { symbol: 'BAJAJHLDNG', name: 'Bajaj Holdings & Investment Limited', exchange: 'NSE', sector: 'Financial Services', marketCap: 'Small' },
  { symbol: 'CDSL', name: 'Central Depository Services (India) Limited', exchange: 'NSE', sector: 'Financial Services', marketCap: 'Small' },
  { symbol: 'CENTURYTEX', name: 'Century Textiles & Industries Limited', exchange: 'NSE', sector: 'Textiles', marketCap: 'Small' },
  { symbol: 'CERA', name: 'Cera Sanitaryware Limited', exchange: 'NSE', sector: 'Building Materials', marketCap: 'Small' },
  { symbol: 'CHAMBLFERT', name: 'Chambal Fertilisers & Chemicals Limited', exchange: 'NSE', sector: 'Fertilizers', marketCap: 'Small' },
  { symbol: 'CLEAN', name: 'Clean Science and Technology Limited', exchange: 'NSE', sector: 'Chemicals', marketCap: 'Small' },
  { symbol: 'COROMANDEL', name: 'Coromandel International Limited', exchange: 'NSE', sector: 'Fertilizers', marketCap: 'Small' },
  { symbol: 'CREDITACC', name: 'Credit Access Grameen Limited', exchange: 'NSE', sector: 'NBFC', marketCap: 'Small' },
  { symbol: 'CROMPTON', name: 'Crompton Greaves Consumer Electricals Limited', exchange: 'NSE', sector: 'Consumer Durables', marketCap: 'Small' },
  { symbol: 'DEEPAKNTR', name: 'Deepak Nitrite Limited', exchange: 'NSE', sector: 'Chemicals', marketCap: 'Small' },
  { symbol: 'EMAMILTD', name: 'Emami Limited', exchange: 'NSE', sector: 'FMCG', marketCap: 'Small' },
  { symbol: 'EQUITAS', name: 'Equitas Holdings Limited', exchange: 'NSE', sector: 'Banking', marketCap: 'Small' },
  { symbol: 'FINEORG', name: 'Fine Organic Industries Limited', exchange: 'NSE', sector: 'Chemicals', marketCap: 'Small' },
  { symbol: 'FLUOROCHEM', name: 'Gujarat Fluorochemicals Limited', exchange: 'NSE', sector: 'Chemicals', marketCap: 'Small' },
  { symbol: 'FORTIS', name: 'Fortis Healthcare Limited', exchange: 'NSE', sector: 'Healthcare', marketCap: 'Small' },
  { symbol: 'GICRE', name: 'General Insurance Corporation of India', exchange: 'NSE', sector: 'Insurance', marketCap: 'Small' },
  { symbol: 'GILLETTE', name: 'Gillette India Limited', exchange: 'NSE', sector: 'FMCG', marketCap: 'Small' },
  { symbol: 'GNFC', name: 'Gujarat Narmada Valley Fertilizers & Chemicals Limited', exchange: 'NSE', sector: 'Fertilizers', marketCap: 'Small' },
  { symbol: 'GODREJAGRO', name: 'Godrej Agrovet Limited', exchange: 'NSE', sector: 'Agriculture', marketCap: 'Small' },
  { symbol: 'GPPL', name: 'Gujarat Pipavav Port Limited', exchange: 'NSE', sector: 'Ports', marketCap: 'Small' },
  { symbol: 'GRAPHITE', name: 'Graphite India Limited', exchange: 'NSE', sector: 'Industrial Materials', marketCap: 'Small' },
  { symbol: 'GUJGASLTD', name: 'Gujarat Gas Limited', exchange: 'NSE', sector: 'Gas Distribution', marketCap: 'Small' },
  { symbol: 'HAPPSTMNDS', name: 'Happiest Minds Technologies Limited', exchange: 'NSE', sector: 'IT Services', marketCap: 'Small' },
  { symbol: 'HINDPETRO', name: 'Hindustan Petroleum Corporation Limited', exchange: 'NSE', sector: 'Oil & Gas', marketCap: 'Small' },
  { symbol: 'HINDCOPPER', name: 'Hindustan Copper Limited', exchange: 'NSE', sector: 'Metals', marketCap: 'Small' },
  { symbol: 'HINDZINC', name: 'Hindustan Zinc Limited', exchange: 'NSE', sector: 'Metals', marketCap: 'Small' },
  { symbol: 'IBREALEST', name: 'Indiabulls Real Estate Limited', exchange: 'NSE', sector: 'Real Estate', marketCap: 'Small' },
  { symbol: 'IEX', name: 'Indian Energy Exchange Limited', exchange: 'NSE', sector: 'Power Trading', marketCap: 'Small' },
  { symbol: 'IGL', name: 'Indraprastha Gas Limited', exchange: 'NSE', sector: 'Gas Distribution', marketCap: 'Small' },
  { symbol: 'INDIACEM', name: 'The India Cements Limited', exchange: 'NSE', sector: 'Cement', marketCap: 'Small' },
  { symbol: 'INDIANHUME', name: 'Indian Hume Pipe Company Limited', exchange: 'NSE', sector: 'Building Materials', marketCap: 'Small' },
  { symbol: 'INDOCO', name: 'Indoco Remedies Limited', exchange: 'NSE', sector: 'Pharmaceuticals', marketCap: 'Small' },
  { symbol: 'INTELLECT', name: 'Intellect Design Arena Limited', exchange: 'NSE', sector: 'IT Services', marketCap: 'Small' },
  { symbol: 'IRCON', name: 'Ircon International Limited', exchange: 'NSE', sector: 'Construction', marketCap: 'Small' },
  { symbol: 'ISEC', name: 'ICICI Securities Limited', exchange: 'NSE', sector: 'Financial Services', marketCap: 'Small' },
  { symbol: 'JKCEMENT', name: 'JK Cement Limited', exchange: 'NSE', sector: 'Cement', marketCap: 'Small' },
  { symbol: 'JKTYRE', name: 'JK Tyre & Industries Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Small' },
  { symbol: 'JMFINANCIL', name: 'JM Financial Limited', exchange: 'NSE', sector: 'Financial Services', marketCap: 'Small' },
  { symbol: 'JUSTDIAL', name: 'Just Dial Limited', exchange: 'NSE', sector: 'Internet', marketCap: 'Small' },
  { symbol: 'KANSAINER', name: 'Kansai Nerolac Paints Limited', exchange: 'NSE', sector: 'Paints', marketCap: 'Small' },
  { symbol: 'KEI', name: 'KEI Industries Limited', exchange: 'NSE', sector: 'Cables', marketCap: 'Small' },
  { symbol: 'KPITTECH', name: 'KPIT Technologies Limited', exchange: 'NSE', sector: 'IT Services', marketCap: 'Small' },
  { symbol: 'KRBL', name: 'KRBL Limited', exchange: 'NSE', sector: 'Food Processing', marketCap: 'Small' },
  { symbol: 'LALPATHLAB', name: 'Dr. Lal PathLabs Limited', exchange: 'NSE', sector: 'Healthcare', marketCap: 'Small' },
  { symbol: 'LAURUSLABS', name: 'Laurus Labs Limited', exchange: 'NSE', sector: 'Pharmaceuticals', marketCap: 'Small' },
  { symbol: 'LTIM', name: 'LTIMindtree Limited', exchange: 'NSE', sector: 'IT Services', marketCap: 'Small' },
  { symbol: 'LUXIND', name: 'Lux Industries Limited', exchange: 'NSE', sector: 'Textiles', marketCap: 'Small' },
  { symbol: 'MAXHEALTH', name: 'Max Healthcare Institute Limited', exchange: 'NSE', sector: 'Healthcare', marketCap: 'Small' },
  { symbol: 'METROPOLIS', name: 'Metropolis Healthcare Limited', exchange: 'NSE', sector: 'Healthcare', marketCap: 'Small' },
  { symbol: 'MINDACORP', name: 'Minda Corporation Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Small' },
  { symbol: 'MINDAIND', name: 'Minda Industries Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Small' },
  { symbol: 'MOIL', name: 'MOIL Limited', exchange: 'NSE', sector: 'Mining', marketCap: 'Small' },
  { symbol: 'MRPL', name: 'Mangalore Refinery and Petrochemicals Limited', exchange: 'NSE', sector: 'Oil & Gas', marketCap: 'Small' },
  { symbol: 'NATCOPHARM', name: 'Natco Pharma Limited', exchange: 'NSE', sector: 'Pharmaceuticals', marketCap: 'Small' },
  { symbol: 'NBCC', name: 'NBCC (India) Limited', exchange: 'NSE', sector: 'Construction', marketCap: 'Small' },
  { symbol: 'NETWORK18', name: 'Network18 Media & Investments Limited', exchange: 'NSE', sector: 'Media', marketCap: 'Small' },
  { symbol: 'NHPC', name: 'NHPC Limited', exchange: 'NSE', sector: 'Power', marketCap: 'Small' },
  { symbol: 'NLCINDIA', name: 'NLC India Limited', exchange: 'NSE', sector: 'Power', marketCap: 'Small' },
  { symbol: 'NOCIL', name: 'NOCIL Limited', exchange: 'NSE', sector: 'Chemicals', marketCap: 'Small' },
  { symbol: 'NUVOCO', name: 'Nuvoco Vistas Corporation Limited', exchange: 'NSE', sector: 'Cement', marketCap: 'Small' },
  { symbol: 'ORIENTELEC', name: 'Orient Electric Limited', exchange: 'NSE', sector: 'Consumer Durables', marketCap: 'Small' },
  { symbol: 'PGHH', name: 'Procter & Gamble Hygiene and Health Care Limited', exchange: 'NSE', sector: 'FMCG', marketCap: 'Small' },
  { symbol: 'POLYMED', name: 'Poly Medicure Limited', exchange: 'NSE', sector: 'Healthcare', marketCap: 'Small' },
  { symbol: 'POWERINDIA', name: 'ABB India Limited', exchange: 'NSE', sector: 'Engineering', marketCap: 'Small' },
  { symbol: 'PRSMJOHNSN', name: 'Prism Johnson Limited', exchange: 'NSE', sector: 'Building Materials', marketCap: 'Small' },
  { symbol: 'QUESS', name: 'Quess Corp Limited', exchange: 'NSE', sector: 'Staffing', marketCap: 'Small' },
  { symbol: 'RADICO', name: 'Radico Khaitan Limited', exchange: 'NSE', sector: 'Beverages', marketCap: 'Small' },
  { symbol: 'RAIN', name: 'Rain Industries Limited', exchange: 'NSE', sector: 'Chemicals', marketCap: 'Small' },
  { symbol: 'RAJESHEXPO', name: 'Rajesh Exports Limited', exchange: 'NSE', sector: 'Gems & Jewellery', marketCap: 'Small' },
  { symbol: 'RELAXO', name: 'Relaxo Footwears Limited', exchange: 'NSE', sector: 'Footwear', marketCap: 'Small' },
  { symbol: 'ROUTE', name: 'Route Mobile Limited', exchange: 'NSE', sector: 'IT Services', marketCap: 'Small' },
  { symbol: 'SCHAEFFLER', name: 'Schaeffler India Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Small' },
  { symbol: 'SEQUENT', name: 'Sequent Scientific Limited', exchange: 'NSE', sector: 'Pharmaceuticals', marketCap: 'Small' },
  { symbol: 'SHANKARA', name: 'Shankara Building Products Limited', exchange: 'NSE', sector: 'Building Materials', marketCap: 'Small' },
  { symbol: 'SHOPERSTOP', name: 'Shoppers Stop Limited', exchange: 'NSE', sector: 'Retail', marketCap: 'Small' },
  { symbol: 'SONACOMS', name: 'Sona BLW Precision Forgings Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Small' },
  { symbol: 'SPARC', name: 'Sun Pharma Advanced Research Company Limited', exchange: 'NSE', sector: 'Pharmaceuticals', marketCap: 'Small' },
  { symbol: 'SPANDANA', name: 'Spandana Sphoorty Financial Limited', exchange: 'NSE', sector: 'NBFC', marketCap: 'Small' },
  { symbol: 'SUNDARMFIN', name: 'Sundaram Finance Limited', exchange: 'NSE', sector: 'NBFC', marketCap: 'Small' },
  { symbol: 'SUNDRMFAST', name: 'Sundram Fasteners Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Small' },
  { symbol: 'SUNTV', name: 'Sun TV Network Limited', exchange: 'NSE', sector: 'Media', marketCap: 'Small' },
  { symbol: 'SUPRAJIT', name: 'Suprajit Engineering Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Small' },
  { symbol: 'SUVEN', name: 'Suven Life Sciences Limited', exchange: 'NSE', sector: 'Pharmaceuticals', marketCap: 'Small' },
  { symbol: 'SYMPHONY', name: 'Symphony Limited', exchange: 'NSE', sector: 'Consumer Durables', marketCap: 'Small' },
  { symbol: 'TATACHEM', name: 'Tata Chemicals Limited', exchange: 'NSE', sector: 'Chemicals', marketCap: 'Small' },
  { symbol: 'TEAMLEASE', name: 'TeamLease Services Limited', exchange: 'NSE', sector: 'Staffing', marketCap: 'Small' },
  { symbol: 'THERMAX', name: 'Thermax Limited', exchange: 'NSE', sector: 'Engineering', marketCap: 'Small' },
  { symbol: 'THYROCARE', name: 'Thyrocare Technologies Limited', exchange: 'NSE', sector: 'Healthcare', marketCap: 'Small' },
  { symbol: 'TIINDIA', name: 'Tube Investments of India Limited', exchange: 'NSE', sector: 'Engineering', marketCap: 'Small' },
  { symbol: 'TIMKEN', name: 'Timken India Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Small' },
  { symbol: 'TRITURBINE', name: 'Triveni Turbine Limited', exchange: 'NSE', sector: 'Engineering', marketCap: 'Small' },
  { symbol: 'TTKPRESTIG', name: 'TTK Prestige Limited', exchange: 'NSE', sector: 'Consumer Durables', marketCap: 'Small' },
  { symbol: 'TUTICORIN', name: 'Tuticorin Alkali Chemicals & Fertilizers Limited', exchange: 'NSE', sector: 'Chemicals', marketCap: 'Small' },
  { symbol: 'UCOBANK', name: 'UCO Bank', exchange: 'NSE', sector: 'Banking', marketCap: 'Small' },
  { symbol: 'UNOMINDA', name: 'UNO Minda Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Small' },
  { symbol: 'UTIAMC', name: 'UTI Asset Management Company Limited', exchange: 'NSE', sector: 'Asset Management', marketCap: 'Small' },
  { symbol: 'VAIBHAVGBL', name: 'Vaibhav Global Limited', exchange: 'NSE', sector: 'Retail', marketCap: 'Small' },
  { symbol: 'VARROC', name: 'Varroc Engineering Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Small' },
  { symbol: 'VGUARD', name: 'V-Guard Industries Limited', exchange: 'NSE', sector: 'Consumer Durables', marketCap: 'Small' },
  { symbol: 'VINATIORGA', name: 'Vinati Organics Limited', exchange: 'NSE', sector: 'Chemicals', marketCap: 'Small' },
  { symbol: 'VSTIND', name: 'VST Industries Limited', exchange: 'NSE', sector: 'Tobacco', marketCap: 'Small' },
  { symbol: 'WABCOINDIA', name: 'Wabco India Limited', exchange: 'NSE', sector: 'Automobile', marketCap: 'Small' },
  { symbol: 'WELCORP', name: 'Welspun Corp Limited', exchange: 'NSE', sector: 'Steel', marketCap: 'Small' },
  { symbol: 'WELSPUNIND', name: 'Welspun India Limited', exchange: 'NSE', sector: 'Textiles', marketCap: 'Small' },
  { symbol: 'WOCKPHARMA', name: 'Wockhardt Limited', exchange: 'NSE', sector: 'Pharmaceuticals', marketCap: 'Small' },
  { symbol: 'ZENSARTECH', name: 'Zensar Technologies Limited', exchange: 'NSE', sector: 'IT Services', marketCap: 'Small' },

  // BSE Large Cap Stocks
  { symbol: '500325', name: 'Reliance Industries Limited', exchange: 'BSE', sector: 'Oil & Gas', marketCap: 'Large' },
  { symbol: '532540', name: 'Tata Consultancy Services', exchange: 'BSE', sector: 'IT Services', marketCap: 'Large' },
  { symbol: '500180', name: 'HDFC Bank Limited', exchange: 'BSE', sector: 'Banking', marketCap: 'Large' },
  { symbol: '500209', name: 'Infosys Limited', exchange: 'BSE', sector: 'IT Services', marketCap: 'Large' },
  { symbol: '532174', name: 'ICICI Bank Limited', exchange: 'BSE', sector: 'Banking', marketCap: 'Large' },
  { symbol: '500696', name: 'Hindustan Unilever Limited', exchange: 'BSE', sector: 'FMCG', marketCap: 'Large' },
  { symbol: '500875', name: 'ITC Limited', exchange: 'BSE', sector: 'FMCG', marketCap: 'Large' },
  { symbol: '500112', name: 'State Bank of India', exchange: 'BSE', sector: 'Banking', marketCap: 'Large' },
  { symbol: '532454', name: 'Bharti Airtel Limited', exchange: 'BSE', sector: 'Telecom', marketCap: 'Large' },
  { symbol: '500247', name: 'Kotak Mahindra Bank Limited', exchange: 'BSE', sector: 'Banking', marketCap: 'Large' },
  { symbol: '500510', name: 'Larsen & Toubro Limited', exchange: 'BSE', sector: 'Engineering', marketCap: 'Large' },
  { symbol: '500820', name: 'Asian Paints Limited', exchange: 'BSE', sector: 'Paints', marketCap: 'Large' },
  { symbol: '532500', name: 'Maruti Suzuki India Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Large' },
  { symbol: '532215', name: 'Axis Bank Limited', exchange: 'BSE', sector: 'Banking', marketCap: 'Large' },
  { symbol: '500114', name: 'Titan Company Limited', exchange: 'BSE', sector: 'Jewellery', marketCap: 'Large' },
  { symbol: '500790', name: 'Nestle India Limited', exchange: 'BSE', sector: 'FMCG', marketCap: 'Large' },
  { symbol: '532538', name: 'UltraTech Cement Limited', exchange: 'BSE', sector: 'Cement', marketCap: 'Large' },
  { symbol: '500034', name: 'Bajaj Finance Limited', exchange: 'BSE', sector: 'NBFC', marketCap: 'Large' },
  { symbol: '507685', name: 'Wipro Limited', exchange: 'BSE', sector: 'IT Services', marketCap: 'Large' },
  { symbol: '532755', name: 'Tech Mahindra Limited', exchange: 'BSE', sector: 'IT Services', marketCap: 'Large' },
  { symbol: '532921', name: 'Adani Ports and Special Economic Zone Limited', exchange: 'BSE', sector: 'Infrastructure', marketCap: 'Large' },
  { symbol: '526863', name: 'Apollo Hospitals Enterprise Limited', exchange: 'BSE', sector: 'Healthcare', marketCap: 'Large' },
  { symbol: '532977', name: 'Bajaj Auto Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Large' },
  { symbol: '532978', name: 'Bajaj Finserv Limited', exchange: 'BSE', sector: 'Financial Services', marketCap: 'Large' },
  { symbol: '500547', name: 'Bharat Petroleum Corporation Limited', exchange: 'BSE', sector: 'Oil & Gas', marketCap: 'Large' },
  { symbol: '500825', name: 'Britannia Industries Limited', exchange: 'BSE', sector: 'FMCG', marketCap: 'Large' },
  { symbol: '500087', name: 'Cipla Limited', exchange: 'BSE', sector: 'Pharmaceuticals', marketCap: 'Large' },
  { symbol: '533278', name: 'Coal India Limited', exchange: 'BSE', sector: 'Mining', marketCap: 'Large' },
  { symbol: '532488', name: 'Divi\'s Laboratories Limited', exchange: 'BSE', sector: 'Pharmaceuticals', marketCap: 'Large' },
  { symbol: '500124', name: 'Dr. Reddy\'s Laboratories Limited', exchange: 'BSE', sector: 'Pharmaceuticals', marketCap: 'Large' },
  { symbol: '505200', name: 'Eicher Motors Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Large' },
  { symbol: '500300', name: 'Grasim Industries Limited', exchange: 'BSE', sector: 'Cement', marketCap: 'Large' },
  { symbol: '532281', name: 'HCL Technologies Limited', exchange: 'BSE', sector: 'IT Services', marketCap: 'Large' },
  { symbol: '500182', name: 'Hero MotoCorp Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Large' },
  { symbol: '500440', name: 'Hindalco Industries Limited', exchange: 'BSE', sector: 'Metals', marketCap: 'Large' },
  { symbol: '532187', name: 'IndusInd Bank Limited', exchange: 'BSE', sector: 'Banking', marketCap: 'Large' },
  { symbol: '530965', name: 'Indian Oil Corporation Limited', exchange: 'BSE', sector: 'Oil & Gas', marketCap: 'Large' },
  { symbol: '500228', name: 'JSW Steel Limited', exchange: 'BSE', sector: 'Steel', marketCap: 'Large' },
  { symbol: '500520', name: 'Mahindra & Mahindra Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Large' },
  { symbol: '532555', name: 'NTPC Limited', exchange: 'BSE', sector: 'Power', marketCap: 'Large' },
  { symbol: '500312', name: 'Oil and Natural Gas Corporation Limited', exchange: 'BSE', sector: 'Oil & Gas', marketCap: 'Large' },
  { symbol: '532898', name: 'Power Grid Corporation of India Limited', exchange: 'BSE', sector: 'Power', marketCap: 'Large' },
  { symbol: '524715', name: 'Sun Pharmaceutical Industries Limited', exchange: 'BSE', sector: 'Pharmaceuticals', marketCap: 'Large' },
  { symbol: '500800', name: 'Tata Consumer Products Limited', exchange: 'BSE', sector: 'FMCG', marketCap: 'Large' },
  { symbol: '500570', name: 'Tata Motors Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Large' },
  { symbol: '500470', name: 'Tata Steel Limited', exchange: 'BSE', sector: 'Steel', marketCap: 'Large' },
  { symbol: '512599', name: 'UPL Limited', exchange: 'BSE', sector: 'Chemicals', marketCap: 'Large' },
  { symbol: '500295', name: 'Vedanta Limited', exchange: 'BSE', sector: 'Metals', marketCap: 'Large' },
  { symbol: '500113', name: 'Steel Authority of India Limited', exchange: 'BSE', sector: 'Steel', marketCap: 'Large' },
  { symbol: '526371', name: 'NMDC Limited', exchange: 'BSE', sector: 'Mining', marketCap: 'Large' },
  { symbol: '532155', name: 'GAIL (India) Limited', exchange: 'BSE', sector: 'Oil & Gas', marketCap: 'Large' },
  { symbol: '532522', name: 'Petronet LNG Limited', exchange: 'BSE', sector: 'Oil & Gas', marketCap: 'Large' },
  { symbol: '532187', name: 'InterGlobe Aviation Limited', exchange: 'BSE', sector: 'Aviation', marketCap: 'Large' },

  // BSE Mid Cap Stocks
  { symbol: '532371', name: 'Tata Teleservices (Maharashtra) Limited', exchange: 'BSE', sector: 'Telecom', marketCap: 'Mid' },
  { symbol: '500425', name: 'Ambuja Cements Limited', exchange: 'BSE', sector: 'Cement', marketCap: 'Mid' },
  { symbol: '532149', name: 'Berger Paints India Limited', exchange: 'BSE', sector: 'Paints', marketCap: 'Mid' },
  { symbol: '532523', name: 'Biocon Limited', exchange: 'BSE', sector: 'Pharmaceuticals', marketCap: 'Mid' },
  { symbol: '500530', name: 'Bosch Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Mid' },
  { symbol: '532321', name: 'Cadila Healthcare Limited', exchange: 'BSE', sector: 'Pharmaceuticals', marketCap: 'Mid' },
  { symbol: '532483', name: 'Canara Bank', exchange: 'BSE', sector: 'Banking', marketCap: 'Mid' },
  { symbol: '500085', name: 'Colgate Palmolive (India) Limited', exchange: 'BSE', sector: 'FMCG', marketCap: 'Mid' },
  { symbol: '500111', name: 'Container Corporation of India Limited', exchange: 'BSE', sector: 'Logistics', marketCap: 'Mid' },
  { symbol: '500124', name: 'Cummins India Limited', exchange: 'BSE', sector: 'Engineering', marketCap: 'Mid' },
  { symbol: '500096', name: 'Dabur India Limited', exchange: 'BSE', sector: 'FMCG', marketCap: 'Mid' },
  { symbol: '532868', name: 'Dalmia Bharat Limited', exchange: 'BSE', sector: 'Cement', marketCap: 'Mid' },
  { symbol: '532809', name: 'Federal Bank Limited', exchange: 'BSE', sector: 'Banking', marketCap: 'Mid' },
  { symbol: '532296', name: 'Glenmark Pharmaceuticals Limited', exchange: 'BSE', sector: 'Pharmaceuticals', marketCap: 'Mid' },
  { symbol: '532424', name: 'Godrej Consumer Products Limited', exchange: 'BSE', sector: 'FMCG', marketCap: 'Mid' },
  { symbol: '533150', name: 'Godrej Properties Limited', exchange: 'BSE', sector: 'Real Estate', marketCap: 'Mid' },
  { symbol: '517354', name: 'Havells India Limited', exchange: 'BSE', sector: 'Consumer Durables', marketCap: 'Mid' },
  { symbol: '540777', name: 'HDFC Asset Management Company Limited', exchange: 'BSE', sector: 'Asset Management', marketCap: 'Mid' },
  { symbol: '540719', name: 'HDFC Life Insurance Company Limited', exchange: 'BSE', sector: 'Insurance', marketCap: 'Mid' },
  { symbol: '540716', name: 'ICICI Lombard General Insurance Company Limited', exchange: 'BSE', sector: 'Insurance', marketCap: 'Mid' },
  { symbol: '540133', name: 'ICICI Prudential Life Insurance Company Limited', exchange: 'BSE', sector: 'Insurance', marketCap: 'Mid' },
  { symbol: '532822', name: 'Vodafone Idea Limited', exchange: 'BSE', sector: 'Telecom', marketCap: 'Mid' },
  { symbol: '539437', name: 'IDFC First Bank Limited', exchange: 'BSE', sector: 'Banking', marketCap: 'Mid' },
  { symbol: '500850', name: 'The Indian Hotels Company Limited', exchange: 'BSE', sector: 'Hotels', marketCap: 'Mid' },
  { symbol: '532286', name: 'Jindal Steel & Power Limited', exchange: 'BSE', sector: 'Steel', marketCap: 'Mid' },
  { symbol: '533155', name: 'Jubilant FoodWorks Limited', exchange: 'BSE', sector: 'Food Services', marketCap: 'Mid' },
  { symbol: '500253', name: 'LIC Housing Finance Limited', exchange: 'BSE', sector: 'Housing Finance', marketCap: 'Mid' },
  { symbol: '500257', name: 'Lupin Limited', exchange: 'BSE', sector: 'Pharmaceuticals', marketCap: 'Mid' },
  { symbol: '531642', name: 'Marico Limited', exchange: 'BSE', sector: 'FMCG', marketCap: 'Mid' },
  { symbol: '500271', name: 'United Spirits Limited', exchange: 'BSE', sector: 'Beverages', marketCap: 'Mid' },
  { symbol: '543220', name: 'Max Financial Services Limited', exchange: 'BSE', sector: 'Insurance', marketCap: 'Mid' },
  { symbol: '532343', name: 'Mahanagar Gas Limited', exchange: 'BSE', sector: 'Gas Distribution', marketCap: 'Mid' },
  { symbol: '532286', name: 'Motherson Sumi Systems Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Mid' },
  { symbol: '526299', name: 'Mphasis Limited', exchange: 'BSE', sector: 'IT Services', marketCap: 'Mid' },
  { symbol: '500790', name: 'MRF Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Mid' },
  { symbol: '533398', name: 'Muthoot Finance Limited', exchange: 'BSE', sector: 'NBFC', marketCap: 'Mid' },
  { symbol: '532777', name: 'Info Edge (India) Limited', exchange: 'BSE', sector: 'Internet', marketCap: 'Mid' },
  { symbol: '533273', name: 'Oberoi Realty Limited', exchange: 'BSE', sector: 'Real Estate', marketCap: 'Mid' },
  { symbol: '532466', name: 'Oracle Financial Services Software Limited', exchange: 'BSE', sector: 'IT Services', marketCap: 'Mid' },
  { symbol: '532654', name: 'Page Industries Limited', exchange: 'BSE', sector: 'Textiles', marketCap: 'Mid' },
  { symbol: '500302', name: 'Piramal Enterprises Limited', exchange: 'BSE', sector: 'Pharmaceuticals', marketCap: 'Mid' },
  { symbol: '532810', name: 'Persistent Systems Limited', exchange: 'BSE', sector: 'IT Services', marketCap: 'Mid' },
  { symbol: '500331', name: 'Pidilite Industries Limited', exchange: 'BSE', sector: 'Chemicals', marketCap: 'Mid' },
  { symbol: '532461', name: 'PI Industries Limited', exchange: 'BSE', sector: 'Chemicals', marketCap: 'Mid' },
  { symbol: '532461', name: 'Punjab National Bank', exchange: 'BSE', sector: 'Banking', marketCap: 'Mid' },
  { symbol: '542652', name: 'Polycab India Limited', exchange: 'BSE', sector: 'Cables', marketCap: 'Mid' },
  { symbol: '532689', name: 'PVR Limited', exchange: 'BSE', sector: 'Entertainment', marketCap: 'Mid' },
  { symbol: '500260', name: 'The Ramco Cements Limited', exchange: 'BSE', sector: 'Cement', marketCap: 'Mid' },
  { symbol: '540065', name: 'RBL Bank Limited', exchange: 'BSE', sector: 'Banking', marketCap: 'Mid' },
  { symbol: '532955', name: 'REC Limited', exchange: 'BSE', sector: 'Financial Services', marketCap: 'Mid' },
  { symbol: '540719', name: 'SBI Life Insurance Company Limited', exchange: 'BSE', sector: 'Insurance', marketCap: 'Mid' },
  { symbol: '500387', name: 'Shree Cement Limited', exchange: 'BSE', sector: 'Cement', marketCap: 'Mid' },
  { symbol: '500550', name: 'Siemens Limited', exchange: 'BSE', sector: 'Engineering', marketCap: 'Mid' },
  { symbol: '524715', name: 'SRF Limited', exchange: 'BSE', sector: 'Chemicals', marketCap: 'Mid' },
  { symbol: '532648', name: 'Shriram Transport Finance Company Limited', exchange: 'BSE', sector: 'NBFC', marketCap: 'Mid' },
  { symbol: '500420', name: 'Torrent Pharmaceuticals Limited', exchange: 'BSE', sector: 'Pharmaceuticals', marketCap: 'Mid' },
  { symbol: '532779', name: 'Torrent Power Limited', exchange: 'BSE', sector: 'Power', marketCap: 'Mid' },
  { symbol: '500251', name: 'Trent Limited', exchange: 'BSE', sector: 'Retail', marketCap: 'Mid' },
  { symbol: '532343', name: 'TVS Motor Company Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Mid' },
  { symbol: '533271', name: 'Ujjivan Financial Services Limited', exchange: 'BSE', sector: 'NBFC', marketCap: 'Mid' },

  // BSE Small Cap Stocks (Sample)
  { symbol: '540611', name: 'Aavas Financiers Limited', exchange: 'BSE', sector: 'Housing Finance', marketCap: 'Small' },
  { symbol: '532892', name: 'Aditya Birla Capital Limited', exchange: 'BSE', sector: 'Financial Services', marketCap: 'Small' },
  { symbol: '535755', name: 'Aditya Birla Fashion and Retail Limited', exchange: 'BSE', sector: 'Retail', marketCap: 'Small' },
  { symbol: '542752', name: 'Affle (India) Limited', exchange: 'BSE', sector: 'Digital Marketing', marketCap: 'Small' },
  { symbol: '539523', name: 'Alkem Laboratories Limited', exchange: 'BSE', sector: 'Pharmaceuticals', marketCap: 'Small' },
   { symbol: '500008', name: 'Amara Raja Batteries Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Small' },
   { symbol: '532921', name: 'Astral Limited', exchange: 'BSE', sector: 'Building Materials', marketCap: 'Small' },
   { symbol: '532978', name: 'Bajaj Holdings & Investment Limited', exchange: 'BSE', sector: 'Financial Services', marketCap: 'Small' },
   { symbol: '543066', name: 'Central Depository Services (India) Limited', exchange: 'BSE', sector: 'Financial Services', marketCap: 'Small' },
   { symbol: '500040', name: 'Century Textiles & Industries Limited', exchange: 'BSE', sector: 'Textiles', marketCap: 'Small' },
   { symbol: '532443', name: 'Cera Sanitaryware Limited', exchange: 'BSE', sector: 'Building Materials', marketCap: 'Small' },
   { symbol: '500085', name: 'Chambal Fertilisers & Chemicals Limited', exchange: 'BSE', sector: 'Fertilizers', marketCap: 'Small' },
   { symbol: '543318', name: 'Clean Science and Technology Limited', exchange: 'BSE', sector: 'Chemicals', marketCap: 'Small' },
   { symbol: '506395', name: 'Coromandel International Limited', exchange: 'BSE', sector: 'Fertilizers', marketCap: 'Small' },
   { symbol: '541729', name: 'Credit Access Grameen Limited', exchange: 'BSE', sector: 'NBFC', marketCap: 'Small' },
   { symbol: '539876', name: 'Crompton Greaves Consumer Electricals Limited', exchange: 'BSE', sector: 'Consumer Durables', marketCap: 'Small' },
   { symbol: '506401', name: 'Deepak Nitrite Limited', exchange: 'BSE', sector: 'Chemicals', marketCap: 'Small' },
   { symbol: '531162', name: 'Emami Limited', exchange: 'BSE', sector: 'FMCG', marketCap: 'Small' },
   { symbol: '543243', name: 'Equitas Holdings Limited', exchange: 'BSE', sector: 'Banking', marketCap: 'Small' },
   { symbol: '543300', name: 'Fine Organic Industries Limited', exchange: 'BSE', sector: 'Chemicals', marketCap: 'Small' },
   { symbol: '506480', name: 'Gujarat Fluorochemicals Limited', exchange: 'BSE', sector: 'Chemicals', marketCap: 'Small' },
   { symbol: '532843', name: 'Fortis Healthcare Limited', exchange: 'BSE', sector: 'Healthcare', marketCap: 'Small' },
   { symbol: '532481', name: 'General Insurance Corporation of India', exchange: 'BSE', sector: 'Insurance', marketCap: 'Small' },
   { symbol: '507815', name: 'Gillette India Limited', exchange: 'BSE', sector: 'FMCG', marketCap: 'Small' },
   { symbol: '500670', name: 'Gujarat Narmada Valley Fertilizers & Chemicals Limited', exchange: 'BSE', sector: 'Fertilizers', marketCap: 'Small' },
   { symbol: '540716', name: 'Godrej Agrovet Limited', exchange: 'BSE', sector: 'Agriculture', marketCap: 'Small' },
   { symbol: '532648', name: 'Gujarat Pipavav Port Limited', exchange: 'BSE', sector: 'Ports', marketCap: 'Small' },
   { symbol: '517354', name: 'Graphite India Limited', exchange: 'BSE', sector: 'Industrial Materials', marketCap: 'Small' },
   { symbol: '539336', name: 'Gujarat Gas Limited', exchange: 'BSE', sector: 'Gas Distribution', marketCap: 'Small' },
   { symbol: '543227', name: 'Happiest Minds Technologies Limited', exchange: 'BSE', sector: 'IT Services', marketCap: 'Small' },
   { symbol: '500104', name: 'Hindustan Petroleum Corporation Limited', exchange: 'BSE', sector: 'Oil & Gas', marketCap: 'Small' },
   { symbol: '513599', name: 'Hindustan Copper Limited', exchange: 'BSE', sector: 'Metals', marketCap: 'Small' },
   { symbol: '500188', name: 'Hindustan Zinc Limited', exchange: 'BSE', sector: 'Metals', marketCap: 'Small' },
   { symbol: '535755', name: 'Indiabulls Real Estate Limited', exchange: 'BSE', sector: 'Real Estate', marketCap: 'Small' },
   { symbol: '540750', name: 'Indian Energy Exchange Limited', exchange: 'BSE', sector: 'Power Trading', marketCap: 'Small' },
   { symbol: '532514', name: 'Indraprastha Gas Limited', exchange: 'BSE', sector: 'Gas Distribution', marketCap: 'Small' },
   { symbol: '530965', name: 'The India Cements Limited', exchange: 'BSE', sector: 'Cement', marketCap: 'Small' },
   { symbol: '500193', name: 'Indian Hume Pipe Company Limited', exchange: 'BSE', sector: 'Building Materials', marketCap: 'Small' },
   { symbol: '500124', name: 'Indoco Remedies Limited', exchange: 'BSE', sector: 'Pharmaceuticals', marketCap: 'Small' },
   { symbol: '532656', name: 'Intellect Design Arena Limited', exchange: 'BSE', sector: 'IT Services', marketCap: 'Small' },
   { symbol: '541336', name: 'Ircon International Limited', exchange: 'BSE', sector: 'Construction', marketCap: 'Small' },
   { symbol: '541336', name: 'ICICI Securities Limited', exchange: 'BSE', sector: 'Financial Services', marketCap: 'Small' },
   { symbol: '532814', name: 'JK Cement Limited', exchange: 'BSE', sector: 'Cement', marketCap: 'Small' },
   { symbol: '500228', name: 'JK Tyre & Industries Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Small' },
   { symbol: '523405', name: 'JM Financial Limited', exchange: 'BSE', sector: 'Financial Services', marketCap: 'Small' },
   { symbol: '532839', name: 'Just Dial Limited', exchange: 'BSE', sector: 'Internet', marketCap: 'Small' },
   { symbol: '500165', name: 'Kansai Nerolac Paints Limited', exchange: 'BSE', sector: 'Paints', marketCap: 'Small' },
   { symbol: '517569', name: 'KEI Industries Limited', exchange: 'BSE', sector: 'Cables', marketCap: 'Small' },
   { symbol: '532400', name: 'KPIT Technologies Limited', exchange: 'BSE', sector: 'IT Services', marketCap: 'Small' },
   { symbol: '532723', name: 'KRBL Limited', exchange: 'BSE', sector: 'Food Processing', marketCap: 'Small' },
   { symbol: '539524', name: 'Dr. Lal PathLabs Limited', exchange: 'BSE', sector: 'Healthcare', marketCap: 'Small' },
   { symbol: '540969', name: 'Laurus Labs Limited', exchange: 'BSE', sector: 'Pharmaceuticals', marketCap: 'Small' },
   { symbol: '540005', name: 'LTIMindtree Limited', exchange: 'BSE', sector: 'IT Services', marketCap: 'Small' },
   { symbol: '526811', name: 'Lux Industries Limited', exchange: 'BSE', sector: 'Textiles', marketCap: 'Small' },
   { symbol: '542749', name: 'Max Healthcare Institute Limited', exchange: 'BSE', sector: 'Healthcare', marketCap: 'Small' },
   { symbol: '539416', name: 'Metropolis Healthcare Limited', exchange: 'BSE', sector: 'Healthcare', marketCap: 'Small' },
   { symbol: '543320', name: 'Minda Corporation Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Small' },
   { symbol: '517334', name: 'Minda Industries Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Small' },
   { symbol: '532286', name: 'MOIL Limited', exchange: 'BSE', sector: 'Mining', marketCap: 'Small' },
   { symbol: '500109', name: 'Mangalore Refinery and Petrochemicals Limited', exchange: 'BSE', sector: 'Oil & Gas', marketCap: 'Small' },
   { symbol: '524816', name: 'Natco Pharma Limited', exchange: 'BSE', sector: 'Pharmaceuticals', marketCap: 'Small' },
   { symbol: '540724', name: 'NBCC (India) Limited', exchange: 'BSE', sector: 'Construction', marketCap: 'Small' },
   { symbol: '532845', name: 'Network18 Media & Investments Limited', exchange: 'BSE', sector: 'Media', marketCap: 'Small' },
   { symbol: '533098', name: 'NHPC Limited', exchange: 'BSE', sector: 'Power', marketCap: 'Small' },
   { symbol: '532147', name: 'NLC India Limited', exchange: 'BSE', sector: 'Power', marketCap: 'Small' },
   { symbol: '500730', name: 'NOCIL Limited', exchange: 'BSE', sector: 'Chemicals', marketCap: 'Small' },
   { symbol: '543334', name: 'Nuvoco Vistas Corporation Limited', exchange: 'BSE', sector: 'Cement', marketCap: 'Small' },
   { symbol: '540301', name: 'Orient Electric Limited', exchange: 'BSE', sector: 'Consumer Durables', marketCap: 'Small' },
   { symbol: '500179', name: 'Procter & Gamble Hygiene and Health Care Limited', exchange: 'BSE', sector: 'FMCG', marketCap: 'Small' },
   { symbol: '524804', name: 'Poly Medicure Limited', exchange: 'BSE', sector: 'Healthcare', marketCap: 'Small' },
   { symbol: '500002', name: 'ABB India Limited', exchange: 'BSE', sector: 'Engineering', marketCap: 'Small' },
   { symbol: '532810', name: 'Prism Johnson Limited', exchange: 'BSE', sector: 'Building Materials', marketCap: 'Small' },
   { symbol: '539978', name: 'Quess Corp Limited', exchange: 'BSE', sector: 'Staffing', marketCap: 'Small' },
   { symbol: '532497', name: 'Radico Khaitan Limited', exchange: 'BSE', sector: 'Beverages', marketCap: 'Small' },
   { symbol: '500339', name: 'Rain Industries Limited', exchange: 'BSE', sector: 'Chemicals', marketCap: 'Small' },
   { symbol: '500124', name: 'Rajesh Exports Limited', exchange: 'BSE', sector: 'Gems & Jewellery', marketCap: 'Small' },
   { symbol: '533122', name: 'Relaxo Footwears Limited', exchange: 'BSE', sector: 'Footwear', marketCap: 'Small' },
   { symbol: '543228', name: 'Route Mobile Limited', exchange: 'BSE', sector: 'IT Services', marketCap: 'Small' },
   { symbol: '505790', name: 'Schaeffler India Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Small' },
   { symbol: '512529', name: 'Sequent Scientific Limited', exchange: 'BSE', sector: 'Pharmaceuticals', marketCap: 'Small' },
   { symbol: '540425', name: 'Shankara Building Products Limited', exchange: 'BSE', sector: 'Building Materials', marketCap: 'Small' },
   { symbol: '506570', name: 'Shoppers Stop Limited', exchange: 'BSE', sector: 'Retail', marketCap: 'Small' },
   { symbol: '543300', name: 'Sona BLW Precision Forgings Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Small' },
   { symbol: '524715', name: 'Sun Pharma Advanced Research Company Limited', exchange: 'BSE', sector: 'Pharmaceuticals', marketCap: 'Small' },
   { symbol: '541540', name: 'Spandana Sphoorty Financial Limited', exchange: 'BSE', sector: 'NBFC', marketCap: 'Small' },
   { symbol: '500103', name: 'Sundaram Finance Limited', exchange: 'BSE', sector: 'NBFC', marketCap: 'Small' },
   { symbol: '500114', name: 'Sundram Fasteners Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Small' },
   { symbol: '532733', name: 'Sun TV Network Limited', exchange: 'BSE', sector: 'Media', marketCap: 'Small' },
   { symbol: '532809', name: 'Suprajit Engineering Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Small' },
   { symbol: '530239', name: 'Suven Life Sciences Limited', exchange: 'BSE', sector: 'Pharmaceuticals', marketCap: 'Small' },
   { symbol: '540394', name: 'Symphony Limited', exchange: 'BSE', sector: 'Consumer Durables', marketCap: 'Small' },
   { symbol: '500770', name: 'Tata Chemicals Limited', exchange: 'BSE', sector: 'Chemicals', marketCap: 'Small' },
   { symbol: '540115', name: 'TeamLease Services Limited', exchange: 'BSE', sector: 'Staffing', marketCap: 'Small' },
   { symbol: '500411', name: 'Thermax Limited', exchange: 'BSE', sector: 'Engineering', marketCap: 'Small' },
   { symbol: '539871', name: 'Thyrocare Technologies Limited', exchange: 'BSE', sector: 'Healthcare', marketCap: 'Small' },
   { symbol: '500900', name: 'Tube Investments of India Limited', exchange: 'BSE', sector: 'Engineering', marketCap: 'Small' },
   { symbol: '500400', name: 'Timken India Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Small' },
   { symbol: '532809', name: 'Triveni Turbine Limited', exchange: 'BSE', sector: 'Engineering', marketCap: 'Small' },
   { symbol: '517506', name: 'TTK Prestige Limited', exchange: 'BSE', sector: 'Consumer Durables', marketCap: 'Small' },
   { symbol: '500770', name: 'Tuticorin Alkali Chemicals & Fertilizers Limited', exchange: 'BSE', sector: 'Chemicals', marketCap: 'Small' },
   { symbol: '532432', name: 'UCO Bank', exchange: 'BSE', sector: 'Banking', marketCap: 'Small' },
   { symbol: '543335', name: 'UNO Minda Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Small' },
   { symbol: '540701', name: 'UTI Asset Management Company Limited', exchange: 'BSE', sector: 'Asset Management', marketCap: 'Small' },
   { symbol: '532156', name: 'Vaibhav Global Limited', exchange: 'BSE', sector: 'Retail', marketCap: 'Small' },
   { symbol: '541578', name: 'Varroc Engineering Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Small' },
   { symbol: '532309', name: 'V-Guard Industries Limited', exchange: 'BSE', sector: 'Consumer Durables', marketCap: 'Small' },
   { symbol: '524200', name: 'Vinati Organics Limited', exchange: 'BSE', sector: 'Chemicals', marketCap: 'Small' },
   { symbol: '509480', name: 'VST Industries Limited', exchange: 'BSE', sector: 'Tobacco', marketCap: 'Small' },
   { symbol: '505790', name: 'Wabco India Limited', exchange: 'BSE', sector: 'Automobile', marketCap: 'Small' },
   { symbol: '532144', name: 'Welspun Corp Limited', exchange: 'BSE', sector: 'Steel', marketCap: 'Small' },
   { symbol: '514162', name: 'Welspun India Limited', exchange: 'BSE', sector: 'Textiles', marketCap: 'Small' },
   { symbol: '532300', name: 'Wockhardt Limited', exchange: 'BSE', sector: 'Pharmaceuticals', marketCap: 'Small' },
   { symbol: '532321', name: 'Zensar Technologies Limited', exchange: 'BSE', sector: 'IT Services', marketCap: 'Small' }
];

// Search functions
export function searchStocks(query: string): StockInfo[] {
  if (!query.trim()) return [];
  
  const searchTerm = query.toLowerCase().trim();
  
  return stockDatabase.filter(stock => 
    stock.symbol.toLowerCase().includes(searchTerm) ||
    stock.name.toLowerCase().includes(searchTerm) ||
    stock.sector.toLowerCase().includes(searchTerm)
  ).slice(0, 50); // Limit results for performance
}

export function searchStocksFast(query: string): StockInfo[] {
  if (!query.trim()) return [];
  
  const searchTerm = query.toLowerCase().trim();
  const results: StockInfo[] = [];
  
  // Fast search with early termination
  for (let i = 0; i < stockDatabase.length && results.length < 20; i++) {
    const stock = stockDatabase[i];
    if (stock.symbol.toLowerCase().includes(searchTerm) ||
        stock.name.toLowerCase().includes(searchTerm)) {
      results.push(stock);
    }
  }
  
  return results;
}

export function searchStocksBySector(sector: string): StockInfo[] {
  return stockDatabase.filter(stock => 
    stock.sector.toLowerCase().includes(sector.toLowerCase())
  );
}

export function getPopularStocks(): StockInfo[] {
  // Return large cap stocks as popular stocks
  return stockDatabase.filter(stock => stock.marketCap === 'Large').slice(0, 20);
}

export function getStockBySymbol(symbol: string): StockInfo | undefined {
  return stockDatabase.find(stock => 
    stock.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

export function getStocksByExchange(exchange: 'NSE' | 'BSE'): StockInfo[] {
  return stockDatabase.filter(stock => stock.exchange === exchange);
}

export function getStocksBySector(sector: string): StockInfo[] {
  return stockDatabase.filter(stock => 
    stock.sector.toLowerCase() === sector.toLowerCase()
  );
}

export function getStocksByMarketCap(marketCap: 'Large' | 'Mid' | 'Small'): StockInfo[] {
  return stockDatabase.filter(stock => stock.marketCap === marketCap);
}

export function getAllSectors(): string[] {
  const sectors = new Set(stockDatabase.map(stock => stock.sector));
  return Array.from(sectors).sort();
}

export function getStockCount(): { total: number; nse: number; bse: number } {
  const nseCount = stockDatabase.filter(stock => stock.exchange === 'NSE').length;
  const bseCount = stockDatabase.filter(stock => stock.exchange === 'BSE').length;
  
  return {
    total: stockDatabase.length,
    nse: nseCount,
    bse: bseCount
  };
}

// Advanced Search Optimization Features
interface SearchIndex {
  symbolIndex: Map<string, StockInfo[]>;
  nameIndex: Map<string, StockInfo[]>;
  sectorIndex: Map<string, StockInfo[]>;
  exactSymbolIndex: Map<string, StockInfo>;
}

interface CacheEntry {
  results: StockInfo[];
  timestamp: number;
}

class SearchOptimizer {
  private searchIndex: SearchIndex;
  private searchCache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;

  constructor() {
    this.searchIndex = this.buildSearchIndex();
  }

  private buildSearchIndex(): SearchIndex {
    const symbolIndex = new Map<string, StockInfo[]>();
    const nameIndex = new Map<string, StockInfo[]>();
    const sectorIndex = new Map<string, StockInfo[]>();
    const exactSymbolIndex = new Map<string, StockInfo>();

    stockDatabase.forEach(stock => {
      // Exact symbol lookup
      exactSymbolIndex.set(stock.symbol.toLowerCase(), stock);

      // Symbol prefix indexing
      const symbol = stock.symbol.toLowerCase();
      for (let i = 1; i <= symbol.length; i++) {
        const prefix = symbol.substring(0, i);
        if (!symbolIndex.has(prefix)) {
          symbolIndex.set(prefix, []);
        }
        symbolIndex.get(prefix)!.push(stock);
      }

      // Name word indexing
      const nameWords = stock.name.toLowerCase().split(/\s+/);
      nameWords.forEach(word => {
        if (word.length >= 2) {
          for (let i = 2; i <= word.length; i++) {
            const prefix = word.substring(0, i);
            if (!nameIndex.has(prefix)) {
              nameIndex.set(prefix, []);
            }
            nameIndex.get(prefix)!.push(stock);
          }
        }
      });

      // Sector indexing
      if (stock.sector) {
        const sector = stock.sector.toLowerCase();
        if (!sectorIndex.has(sector)) {
          sectorIndex.set(sector, []);
        }
        sectorIndex.get(sector)!.push(stock);
      }
    });

    return { symbolIndex, nameIndex, sectorIndex, exactSymbolIndex };
  }

  // Levenshtein distance for fuzzy search
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private getCachedResults(query: string): StockInfo[] | null {
    const cached = this.searchCache.get(query);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.results;
    }
    return null;
  }

  private setCachedResults(query: string, results: StockInfo[]): void {
    // LRU cache implementation
    if (this.searchCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.searchCache.keys().next().value;
      this.searchCache.delete(oldestKey);
    }
    
    this.searchCache.set(query, {
      results: [...results],
      timestamp: Date.now()
    });
  }

  searchOptimized(query: string, options: {
    limit?: number;
    fuzzy?: boolean;
    fuzzyThreshold?: number;
  } = {}): StockInfo[] {
    if (!query.trim()) return [];

    const { limit = 50, fuzzy = false, fuzzyThreshold = 2 } = options;
    const searchTerm = query.toLowerCase().trim();

    // Check cache first
    const cached = this.getCachedResults(searchTerm);
    if (cached) {
      return cached.slice(0, limit);
    }

    const results = new Set<StockInfo>();
    const scores = new Map<StockInfo, number>();

    // 1. Exact symbol match (highest priority)
    const exactMatch = this.searchIndex.exactSymbolIndex.get(searchTerm);
    if (exactMatch) {
      results.add(exactMatch);
      scores.set(exactMatch, 100);
    }

    // 2. Symbol prefix matches
    const symbolMatches = this.searchIndex.symbolIndex.get(searchTerm) || [];
    symbolMatches.forEach(stock => {
      if (!results.has(stock)) {
        results.add(stock);
        const score = stock.symbol.toLowerCase().startsWith(searchTerm) ? 90 : 80;
        scores.set(stock, score);
      }
    });

    // 3. Name matches
    const nameMatches = this.searchIndex.nameIndex.get(searchTerm) || [];
    nameMatches.forEach(stock => {
      if (!results.has(stock)) {
        results.add(stock);
        scores.set(stock, 70);
      }
    });

    // 4. Sector matches
    const sectorMatches = this.searchIndex.sectorIndex.get(searchTerm) || [];
    sectorMatches.forEach(stock => {
      if (!results.has(stock)) {
        results.add(stock);
        scores.set(stock, 60);
      }
    });

    // 5. Fuzzy search if enabled and not enough results
    if (fuzzy && results.size < limit) {
      stockDatabase.forEach(stock => {
        if (!results.has(stock)) {
          const symbolDistance = this.levenshteinDistance(searchTerm, stock.symbol.toLowerCase());
          const nameDistance = this.levenshteinDistance(searchTerm, stock.name.toLowerCase());
          
          if (symbolDistance <= fuzzyThreshold) {
            results.add(stock);
            scores.set(stock, 50 - symbolDistance * 10);
          } else if (nameDistance <= fuzzyThreshold) {
            results.add(stock);
            scores.set(stock, 40 - nameDistance * 10);
          }
        }
      });
    }

    // Sort by score and return
    const sortedResults = Array.from(results)
      .sort((a, b) => (scores.get(b) || 0) - (scores.get(a) || 0))
      .slice(0, limit);

    // Cache results
    this.setCachedResults(searchTerm, sortedResults);

    return sortedResults;
  }

  searchFuzzy(query: string, limit: number = 20): StockInfo[] {
    return this.searchOptimized(query, { limit, fuzzy: true, fuzzyThreshold: 2 });
  }

  clearCache(): void {
    this.searchCache.clear();
  }

  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.searchCache.size,
      maxSize: this.MAX_CACHE_SIZE
    };
  }
}

// Global search optimizer instance
const searchOptimizer = new SearchOptimizer();

// Debounced search function
let searchTimeout: NodeJS.Timeout | null = null;

export function searchStocksDebounced(
  query: string,
  callback: (results: StockInfo[]) => void,
  delay: number = 300
): void {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
    const results = searchOptimizer.searchOptimized(query);
    callback(results);
  }, delay);
}

// Enhanced search functions
export function searchStocksOptimized(query: string, limit: number = 50): StockInfo[] {
  return searchOptimizer.searchOptimized(query, { limit });
}

export function searchStocksFuzzy(query: string, limit: number = 20): StockInfo[] {
  return searchOptimizer.searchFuzzy(query, limit);
}

export function searchStocksAdvanced(query: string, options: {
  limit?: number;
  fuzzy?: boolean;
  fuzzyThreshold?: number;
  exchange?: 'NSE' | 'BSE';
  marketCap?: 'Large' | 'Mid' | 'Small';
  sector?: string;
} = {}): StockInfo[] {
  const { exchange, marketCap, sector, ...searchOptions } = options;
  
  let results = searchOptimizer.searchOptimized(query, searchOptions);
  
  // Apply additional filters
  if (exchange) {
    results = results.filter(stock => stock.exchange === exchange);
  }
  
  if (marketCap) {
    results = results.filter(stock => stock.marketCap === marketCap);
  }
  
  if (sector) {
    results = results.filter(stock => 
      stock.sector?.toLowerCase().includes(sector.toLowerCase())
    );
  }
  
  return results;
}

// Performance monitoring
export function getSearchPerformanceStats(): {
  totalStocks: number;
  cacheStats: { size: number; maxSize: number };
  indexSizes: {
    symbols: number;
    names: number;
    sectors: number;
  };
} {
  return {
    totalStocks: stockDatabase.length,
    cacheStats: searchOptimizer.getCacheStats(),
    indexSizes: {
      symbols: searchOptimizer['searchIndex'].symbolIndex.size,
      names: searchOptimizer['searchIndex'].nameIndex.size,
      sectors: searchOptimizer['searchIndex'].sectorIndex.size
    }
  };
}

// Clear search cache (useful for memory management)
export function clearSearchCache(): void {
  searchOptimizer.clearCache();
}