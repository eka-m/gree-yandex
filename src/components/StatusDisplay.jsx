import React from 'react'

const StatusDisplay = ({ deviceStatus }) => {
	const getModeIcon = (mode) => {
		switch (mode) {
			case 'auto': return '🔄'
			case 'cool': return '❄️'
			case 'heat': return '🔥'
			case 'dry': return '💧'
			case 'fan_only': return '💨'
			default: return '❓'
		}
	}

	const getModeLabel = (mode) => {
		switch (mode) {
			case 'auto': return 'Авто'
			case 'cool': return 'Охлаждение'
			case 'heat': return 'Обогрев'
			case 'dry': return 'Осушение'
			case 'fan_only': return 'Вентилятор'
			default: return 'Неизвестно'
		}
	}

	return (
		<div className="bg-white rounded-xl shadow-lg p-6">
			<h3 className="text-lg font-semibold text-gray-800 mb-4">
				Текущий статус
			</h3>

			<div className="space-y-3">
				<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
					<span className="text-gray-600">Состояние:</span>
					<span className={`font-medium ${deviceStatus.power === 'on' ? 'text-green-600' : 'text-red-600'}`}>
						{deviceStatus.power === 'on' ? 'Включен' : 'Выключен'}
					</span>
				</div>

				<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
					<span className="text-gray-600">Режим:</span>
					<span className="font-medium text-gray-800">
						{getModeIcon(deviceStatus.mode)} {getModeLabel(deviceStatus.mode)}
					</span>
				</div>

				<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
					<span className="text-gray-600">Температура:</span>
					<span className="font-medium text-blue-600">
						{deviceStatus.temperature}°C
					</span>
				</div>

				<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
					<span className="text-gray-600">Вентилятор:</span>
					<span className="font-medium text-gray-800">
						{deviceStatus.fanSpeed === 'auto' ? 'Авто' : deviceStatus.fanSpeed}
					</span>
				</div>

				<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
					<span className="text-gray-600">Подсветка:</span>
					<span className={`font-medium ${deviceStatus.lights === 'on' ? 'text-yellow-600' : 'text-gray-500'}`}>
						{deviceStatus.lights === 'on' ? 'Включена' : 'Выключена'}
					</span>
				</div>

				{deviceStatus.health === 'on' && (
					<div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
						<span className="text-gray-600">Очистка:</span>
						<span className="font-medium text-green-600">Включена</span>
					</div>
				)}

				{deviceStatus.turbo === 'on' && (
					<div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
						<span className="text-gray-600">Турбо:</span>
						<span className="font-medium text-red-600">Включен</span>
					</div>
				)}

				{deviceStatus.sleep === 'on' && (
					<div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
						<span className="text-gray-600">Режим сна:</span>
						<span className="font-medium text-purple-600">Включен</span>
					</div>
				)}
			</div>
		</div>
	)
}

export default StatusDisplay 