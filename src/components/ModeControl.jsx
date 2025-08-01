import React from 'react'

const ModeControl = ({ mode, onModeChange }) => {
	const modes = [
		{ value: 'auto', label: 'Авто', icon: '🔄', color: 'bg-gray-500' },
		{ value: 'cool', label: 'Охлаждение', icon: '❄️', color: 'bg-blue-500' },
		{ value: 'heat', label: 'Обогрев', icon: '🔥', color: 'bg-red-500' },
		{ value: 'dry', label: 'Осушение', icon: '💧', color: 'bg-cyan-500' },
		{ value: 'fan_only', label: 'Вентилятор', icon: '💨', color: 'bg-green-500' }
	]

	return (
		<div className="bg-white rounded-xl shadow-lg p-6">
			<h3 className="text-lg font-semibold text-gray-800 mb-4">
				Режим работы
			</h3>
			<div className="grid grid-cols-5 gap-2">
				{modes.map((modeOption) => (
					<button
						key={modeOption.value}
						onClick={() => onModeChange(modeOption.value)}
						className={`p-3 rounded-lg text-center transition-all duration-200 ${mode === modeOption.value
								? `${modeOption.color} text-white shadow-lg`
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
							}`}
					>
						<div className="text-2xl mb-1">{modeOption.icon}</div>
						<div className="text-xs font-medium">{modeOption.label}</div>
					</button>
				))}
			</div>
		</div>
	)
}

export default ModeControl 