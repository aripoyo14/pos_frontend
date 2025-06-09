'use client';

import { useState } from 'react';
import { Camera, Plus, ShoppingCart, Loader2, X } from 'lucide-react';
import BarcodeScanner from '@/components/BarcodeScanner';

interface PurchaseItem {
  id: string;
  name: string;
  barcode: string;
  unitPrice: number;
  quantity: number;
  prdId?: number;
}

interface ProductResponse {
  prd_id: number;
  code: string;
  name: string;
  price: number;
}

interface TransactionItem {
  PRD_ID: number;
  PRD_CODE: string;
  PRD_NAME: string;
  PRD_PRICE: number;
  TAX_CD: string;
  PRD_COUNT: number;
}

interface TransactionRequest {
  EMP_CD: string | null;
  STORE_CD: string;
  POS_NO: string;
  TOTAL_AMT: number;
  TTL_AMT_EX_TAX: number;
  ITEMS: TransactionItem[];
}

interface TransactionResponse {
  totalPrice: number;
  totalPriceNoTax: number;
}

export default function Home() {
  const [barcode, setBarcode] = useState('');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [purchaseList, setPurchaseList] = useState<PurchaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [transactionData, setTransactionData] = useState<TransactionResponse | null>(null);
  const [prdId, setPrdId] = useState<number | undefined>(undefined);

  const handleScan = () => {
    setShowScanner(true);
  };

  const handleBarcodeScanned = async (scannedBarcode: string) => {
    try {
      setBarcode(scannedBarcode);
      setIsLoading(true);
      
      // リクエストの内容を準備
      const requestBody = { code: scannedBarcode };
      const requestConfig = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      };
      
      // 内部APIから商品情報を取得
      const response = await fetch('/api/barcode', requestConfig);
      
      if (!response.ok) {
        if (response.status === 404) {
          alert("その商品、取り扱ってへんねん。ごめんやで！！");
          setBarcode('');
          return;
        }
        const errorData = await response.json().catch(() => null);
        console.error('API Error:', errorData);
        alert(`商品情報の取得中にエラーが発生しました。`);
        return;
      }
      
      const productData: ProductResponse = await response.json();
      if (!productData) {
        alert('その商品、取り扱ってへんねん。ごめんやで！！');
        setBarcode('');
        return;
      }
      
      setProductName(productData.name);
      setPrice(productData.price.toString());
      setPrdId(productData.prd_id);
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('商品情報の取得中にエラーが発生しました。');
      setBarcode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!productName.trim() || !price || !barcode.trim()) {
      alert('すべての項目を入力してください');
      return;
    }

    const numericPrice = parseInt(price.replace(/[^\d]/g, ''));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      alert('正しい価格を入力してください');
      return;
    }

    // Check if item already exists
    const existingItemIndex = purchaseList.findIndex(item => item.barcode === barcode);
    
    if (existingItemIndex !== -1) {
      // Update quantity if item exists
      const updatedList = [...purchaseList];
      updatedList[existingItemIndex].quantity += 1;
      setPurchaseList(updatedList);
    } else {
      // Add new item
      const newItem: PurchaseItem = {
        id: Date.now().toString(),
        name: productName,
        barcode: barcode,
        unitPrice: numericPrice,
        quantity: 1,
        prdId: prdId,
      };
      setPurchaseList([...purchaseList, newItem]);
    }

    // Clear form after adding item
    setBarcode('');
    setProductName('');
    setPrice('');
    setPrdId(undefined);
  };

  const handlePurchase = async () => {
    if (purchaseList.length === 0) {
      alert('購入する商品がありません');
      return;
    }
    
    setIsPurchasing(true);
    
    try {
      // 取引データを準備
      const transactionData: TransactionRequest = {
        EMP_CD: "9999999999",
        STORE_CD: "30", 
        POS_NO: "90",
        TOTAL_AMT: totalAmount,
        TTL_AMT_EX_TAX: Math.floor(totalAmount / 1.1), // 仮の税抜き計算
        ITEMS: purchaseList.map(item => ({
          PRD_ID: item.prdId || 0,
          PRD_CODE: item.barcode,
          PRD_NAME: item.name,
          PRD_PRICE: item.unitPrice,
          TAX_CD: "10",
          PRD_COUNT: item.quantity
        }))
      };

      // 内部APIに取引データを送信
      const response = await fetch('/api/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: TransactionResponse = await response.json();
      
      // 取引データを保存してモーダルを表示
      setTransactionData(result);
      setShowPurchaseModal(true);
      
      // 購入リストをクリア
      setPurchaseList([]);
      
    } catch (error) {
      console.error('Purchase error:', error);
      alert('購入処理中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsPurchasing(false);
    }
  };

  const totalAmount = purchaseList.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gray-100 py-4 px-3 sm:py-8 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8">テクワンPOPUP POS</h1>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column - Input Section */}
          <div className="space-y-4 sm:space-y-6">
            {/* Scan Button */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <button
                onClick={handleScan}
                disabled={isLoading || isPurchasing}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-base sm:text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                    読み込み中...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                    スキャン（カメラ）
                  </>
                )}
              </button>
            </div>

            {/* Input Form */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  バーコード
                </label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="12345678901"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
                  disabled={isLoading || isPurchasing}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  商品名
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="おーいお茶"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
                  disabled={isLoading || isPurchasing}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  価格
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="150"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
                  disabled={isLoading || isPurchasing}
                />
              </div>
              
              <button
                onClick={handleAddItem}
                disabled={isLoading || isPurchasing}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-base sm:text-lg"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                追加
              </button>
            </div>
          </div>

          {/* Right Column - Purchase List */}
          <div className="space-y-4 sm:space-y-6">
            {/* Purchase List */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 text-center">購入リスト</h2>
              
              {purchaseList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  購入する商品がありません
                </div>
              ) : (
                <>
                  {/* Mobile View - Card Layout */}
                  <div className="block sm:hidden space-y-3">
                    {purchaseList.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="font-medium text-gray-900 mb-1">{item.name}</div>
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <span>×{item.quantity}</span>
                          <span>{item.unitPrice.toLocaleString()}円</span>
                        </div>
                        <div className="text-right font-medium text-gray-900 mt-1">
                          {(item.unitPrice * item.quantity).toLocaleString()}円
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop/Tablet View - Table Layout */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-2 font-medium text-gray-700">商品名</th>
                          <th className="text-center py-3 px-2 font-medium text-gray-700">個数</th>
                          <th className="text-right py-3 px-2 font-medium text-gray-700">単価</th>
                          <th className="text-right py-3 px-2 font-medium text-gray-700">単品合計</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseList.map((item) => (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-3 px-2 text-gray-900">{item.name}</td>
                            <td className="py-3 px-2 text-center">
                              ×{item.quantity}
                            </td>
                            <td className="py-3 px-2 text-right text-gray-700">{item.unitPrice.toLocaleString()}円</td>
                            <td className="py-3 px-2 text-right font-medium text-gray-900">
                              {(item.unitPrice * item.quantity).toLocaleString()}円
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-lg sm:text-xl font-bold text-gray-900">
                      <span>合計（税抜）</span>
                      <span>{totalAmount.toLocaleString()}円</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Purchase Button */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <button
                onClick={handlePurchase}
                disabled={purchaseList.length === 0 || isLoading || isPurchasing}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-base sm:text-lg"
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                    処理中...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                    購入
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          isOpen={showScanner}
          onScan={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Purchase Complete Modal */}
      {showPurchaseModal && transactionData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-sm sm:max-w-md w-full relative shadow-lg">
            <button
              onClick={() => setShowPurchaseModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="p-4 sm:p-6 text-center">
              <div className="space-y-2 text-base sm:text-lg">
                <p className="text-gray-800">まいどおおきに！また来てな！</p>
                <p className="font-bold text-lg sm:text-xl">
                  合計 {transactionData.totalPrice.toLocaleString()}円 
                  <br className="sm:hidden" />
                  <span className="hidden sm:inline">（</span>
                  <span className="sm:hidden">（</span>税抜き {transactionData.totalPriceNoTax.toLocaleString()}円）
                </p>
              </div>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 sm:px-8 rounded-lg transition-colors duration-200"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}