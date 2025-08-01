import React, { useState } from 'react'
import HVACScanner from './HVACScanner'

const ConnectionSettings = ({ onConnect, onDisconnect, isConnected }) => {
	const [ipAddress, setIpAddress] = useState('192.168.1.100')
	const [isConnecting, setIsConnecting] = useState(false)
	const [showScanner, setShowScanner] = useState(false)

	const handleConnect = async () => {
		setIsConnecting(true)
		try {
			const response = await fetch('/api/connect', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ host: ipAddress }),
			})

			if (response.ok) {
				onConnect && onConnect()
			} else {
				console.error('Ошибка подключения')
			}
		} catch (error) {
			console.error('Ошибка подключения:', error)
		} finally {
			setIsConnecting(false)
		}
	}

	const handleDisconnect = async () => {
		try {
			await fetch('/api/disconnect', {
				method: 'POST',
			})
			onDisconnect && onDisconnect()
		} catch (error) {
			console.error('Ошибка отключения:', error)
		}
	}

	const handleDeviceSelect = (ip) => {
		setIpAddress(ip)
		setShowScanner(false)
	}

	return (
		<div className="bg-white rounded-xl shadow-lg p-6 mb-6">
			<h3 className="text-lg font-semibold text-gray-800 mb-4">
				Настройки подключения
			</h3>

			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						IP адрес кондиционера (порт 7000 будет добавлен автоматически)
					</label>
					<input
						type="text"
						value={ipAddress}
						onChange={(e) => setIpAddress(e.target.value)}
						placeholder="192.168.31.8"
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={isConnected}
					/>
					<p className="text-xs text-gray-500 mt-1">
						Пример: 192.168.31.8 (порт 7000 добавится автоматически)
					</p>
				</div>

				<div className="flex space-x-3">
					{!isConnected ? (
						<button
							onClick={handleConnect}
							disabled={isConnecting}
							className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{isConnecting ? 'Подключение...' : 'Подключиться'}
						</button>
					) : (
						<button
							onClick={handleDisconnect}
							className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
						>
							Отключиться
						</button>
					)}

					<button
						onClick={() => setShowScanner(!showScanner)}
						className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
					>
						{showScanner ? 'Скрыть поиск' : '🔍 Поиск'}
					</button>

					<button
						onClick={() => window.open('http://localhost:3001/api/status', '_blank')}
						className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
					>
						Статус API
					</button>
				</div>

				<div className="text-sm text-gray-600">
					<p>💡 Нажмите "🔍 Поиск" чтобы найти кондиционеры в сети автоматически</p>
				</div>
			</div>

			{/* Сканер кондиционеров */}
			{showScanner && (
				<HVACScanner onDeviceSelect={handleDeviceSelect} />
			)}
		</div>
	)
}

export default ConnectionSettings 