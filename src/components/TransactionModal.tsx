import React, { useState, useEffect } from 'react';
import { X, Calendar, RefreshCw } from 'lucide-react';
import type { Stock, Transaction } from '../types';
import { fetchStockPrice } from '../utils/priceApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: Transaction) => void;
  stock: Stock | null;
}

const TransactionModal: React.FC<Props> = ({ isOpen, onClose, onAdd, stock }) => {
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [currentMarketPrice, setCurrentMarketPrice] = useState<number | null>(null);

  // Fetch current market price when modal opens
  useEffect(() => {
    if (isOpen && stock) {
      fetchCurrentPrice();
    }
  }, [isOpen, stock]);

  const fetchCurrentPrice = async () => {
    if (!stock) return;
    
    setIsLoadingPrice(true);
    try {
      const priceData = await fetchStockPrice(stock.symbol);
      if (priceData && priceData.price) {
        setCurrentMarketPrice(priceData.price);
        setPrice(priceData.price.toString());
      }
    } catch (error) {
      console.error('Error fetching current price:', error);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  if (!isOpen || !stock) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity.trim() || !price.trim()) return;

    const quantityNum = parseFloat(quantity);
    const priceNum = parseFloat(price);
    
    if (quantityNum <= 0 || priceNum <= 0) {
      alert('Please enter valid positive numbers for quantity and price.');
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now(),
      symbol: stock.symbol,
      displaySymbol: stock.displaySymbol,
      name: stock.name,
      type,
      quantity: quantityNum,
      price: priceNum,
      date,
      total: quantityNum * priceNum
    };

    onAdd(newTransaction);
    setQuantity('');
    setPrice('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add Transaction</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="font-semibold text-gray-900">{stock.symbol}</div>
            <div className="text-sm text-gray-600">{stock.name}</div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Transaction Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('buy')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                  type === 'buy'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setType('sell')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                  type === 'sell'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sell
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              placeholder="Number of shares"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              min="1"
              step="1"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Price per Share
              </label>
              <div className="flex items-center gap-2">
                {currentMarketPrice && (
                  <span className="text-xs text-green-600 font-semibold">
                    Market: ₹{currentMarketPrice.toFixed(2)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={fetchCurrentPrice}
                  disabled={isLoadingPrice}
                  className="text-indigo-600 hover:text-indigo-800 p-1 rounded transition-colors disabled:opacity-50"
                  title="Refresh current market price"
                >
                  <RefreshCw size={14} className={isLoadingPrice ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400 text-lg font-bold">₹</span>
              <input
                type="number"
                placeholder={isLoadingPrice ? "Loading..." : "0.00"}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                min="0"
                step="0.01"
                disabled={isLoadingPrice}
              />
            </div>
            {currentMarketPrice && (
              <div className="text-xs text-gray-500 mt-1">
                Current market price automatically loaded
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {quantity && price && (
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-sm text-indigo-600 font-semibold">Total Amount</div>
              <div className="text-2xl font-bold text-indigo-900">
                ₹{(parseFloat(quantity) * parseFloat(price)).toLocaleString()}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-3 text-white rounded-lg font-semibold transition-colors ${
                type === 'buy'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {type === 'buy' ? 'Buy' : 'Sell'} Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;