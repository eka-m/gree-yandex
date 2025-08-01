import React, { useState } from 'react'

const HVACScanner = ({ onDeviceSelect }) => {
	const [isScanning, setIsScanning] = useState(false)
	const [devices, setDevices] = useState([])
	const [error, setError] = useState('')

	const startScan = async () => {
		setIsScanning(true)
		setError('')
		setDevices([])

		try {
			const response = await fetch('/api/scan-hvac', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			})

			const data = await response.json()

			if (data.success) {
				setDevices(data.devices)
				if (data.devices.length === 0) {
					setError('Кондиционеры не найдены. Проверьте подключение к сети.')
				}
			} else {
				setError(data.error || 'Ошибка поиска')
			}
		} catch (error) {
			setError('Ошибка подключения к серверу')
			console.error('Ошибка поиска:', error)
		} finally {
			setIsScanning(false)
		}
	}

	const selectDevice = (device) => {
		onDeviceSelect(device.ip)
	}

	return (
		<div className="bg-white rounded-xl shadow-lg p-6 mb-6">
			<h3 className="text-lg font-semibold text-gray-800 mb-4">
				Поиск кондиционеров
			</h3>

			<div className="space-y-4">
				<button
					onClick={startScan}
					disabled={isScanning}
					className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{isScanning ? (
						<div className="flex items-center justify-center">
							<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
							Поиск кондиционеров...
						</div>
					) : (
						'🔍 Найти кондиционеры в сети'
					)}
				</button>

				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
						{error}
					</div>
				)}

				{devices.length > 0 && (
					<div>
						<h4 className="text-sm font-medium text-gray-700 mb-2">
							Найденные кондиционеры:
						</h4>
						<div className="space-y-2">
							{devices.map((device, index) => (
								<div
									key={index}
									className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
									onClick={() => selectDevice(device)}
								>
									<div>
										<div className="font-medium text-gray-800">
											Кондиционер {index + 1}
										</div>
										<div className="text-sm text-gray-600">
											IP: {device.ip}:{device.port}
										</div>
									</div>
									<button className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors">
										Выбрать
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				<div className="text-sm text-gray-600">
					<p>💡 Поиск займет около 20 секунд. Система проверит различные протоколы и порты.</p>
					<p>🔍 Сканируется подсеть: 192.168.31.x</p>
				</div>
			</div>
		</div>
	)
}

export default HVACScanner 