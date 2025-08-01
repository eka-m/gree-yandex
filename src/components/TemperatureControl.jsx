import React from 'react'

const TemperatureControl = ({ temperature, currentTemperature, onTemperatureChange }) => {
	const handleTemperatureChange = (newTemp) => {
		if (newTemp >= 16 && newTemp <= 30) {
			onTemperatureChange(newTemp)
		}
	}

	return (
		<div className="bg-white rounded-xl shadow-lg p-6">
			<h3 className="text-lg font-semibold text-gray-800 mb-4">
				Температура
			</h3>

			{/* Current Temperature Display */}
			<div className="text-center mb-6">
				<div className="text-3xl font-bold text-blue-600">
					{currentTemperature}°C
				</div>
				<div className="text-sm text-gray-500">Текущая температура</div>
			</div>

			{/* Temperature Control */}
			<div className="text-center">
				<div className="text-4xl font-bold text-gray-800 mb-4">
					{temperature}°C
				</div>
				<div className="text-sm text-gray-500 mb-4">Установленная температура</div>

				<div className="flex items-center justify-center space-x-4">
					<button
						onClick={() => handleTemperatureChange(temperature - 1)}
						className="w-12 h-12 rounded-full bg-blue-500 text-white text-xl font-bold hover:bg-blue-600 transition-colors"
					>
						-
					</button>

					<div className="w-32 h-2 bg-gray-200 rounded-full">
						<div
							className="h-2 bg-blue-500 rounded-full transition-all duration-300"
							style={{ width: `${((temperature - 16) / (30 - 16)) * 100}%` }}
						></div>
					</div>

					<button
						onClick={() => handleTemperatureChange(temperature + 1)}
						className="w-12 h-12 rounded-full bg-blue-500 text-white text-xl font-bold hover:bg-blue-600 transition-colors"
					>
						+
					</button>
				</div>

				<div className="flex justify-between text-xs text-gray-400 mt-2">
					<span>16°C</span>
					<span>30°C</span>
				</div>
			</div>
		</div>
	)
}

export default TemperatureControl 