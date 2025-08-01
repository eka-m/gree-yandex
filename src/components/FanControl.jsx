import React from 'react'

const FanControl = ({ fanSpeed, onFanSpeedChange }) => {
	const speeds = [
		{ value: 'auto', label: 'Авто', icon: '🔄' },
		{ value: 'low', label: 'Низкая', icon: '💨' },
		{ value: 'mediumLow', label: 'Средне-низкая', icon: '💨💨' },
		{ value: 'medium', label: 'Средняя', icon: '💨💨💨' },
		{ value: 'mediumHigh', label: 'Средне-высокая', icon: '💨💨💨💨' },
		{ value: 'high', label: 'Высокая', icon: '💨💨💨💨💨' }
	]

	return (
		<div className="bg-white rounded-xl shadow-lg p-6">
			<h3 className="text-lg font-semibold text-gray-800 mb-4">
				Скорость вентилятора
			</h3>
			<div className="grid grid-cols-3 gap-2">
				{speeds.map((speed) => (
					<button
						key={speed.value}
						onClick={() => onFanSpeedChange(speed.value)}
						className={`p-3 rounded-lg text-center transition-all duration-200 ${fanSpeed === speed.value
								? 'bg-blue-500 text-white shadow-lg'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
							}`}
					>
						<div className="text-lg mb-1">{speed.icon}</div>
						<div className="text-xs font-medium">{speed.label}</div>
					</button>
				))}
			</div>
		</div>
	)
}

export default FanControl 