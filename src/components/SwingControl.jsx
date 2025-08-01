import React from 'react'

const SwingControl = ({ swingHor, swingVert, onSwingHorChange, onSwingVertChange }) => {
	const horizontalOptions = [
		{ value: 'default', label: 'По умолчанию' },
		{ value: 'full', label: 'Полный поворот' },
		{ value: 'fixedLeft', label: 'Влево' },
		{ value: 'fixedMidLeft', label: 'Средне-влево' },
		{ value: 'fixedMid', label: 'По центру' },
		{ value: 'fixedMidRight', label: 'Средне-вправо' },
		{ value: 'fixedRight', label: 'Вправо' }
	]

	const verticalOptions = [
		{ value: 'default', label: 'По умолчанию' },
		{ value: 'full', label: 'Полный поворот' },
		{ value: 'fixedTop', label: 'Вверх' },
		{ value: 'fixedMidTop', label: 'Средне-вверх' },
		{ value: 'fixedMid', label: 'По центру' },
		{ value: 'fixedMidBottom', label: 'Средне-вниз' },
		{ value: 'fixedBottom', label: 'Вниз' }
	]

	return (
		<div className="bg-white rounded-xl shadow-lg p-6">
			<h3 className="text-lg font-semibold text-gray-800 mb-4">
				Поворот жалюзи
			</h3>

			{/* Horizontal Swing */}
			<div className="mb-4">
				<h4 className="text-sm font-medium text-gray-700 mb-2">Горизонтальный поворот</h4>
				<div className="grid grid-cols-2 gap-2">
					{horizontalOptions.map((option) => (
						<button
							key={option.value}
							onClick={() => onSwingHorChange(option.value)}
							className={`p-2 rounded text-xs transition-all duration-200 ${swingHor === option.value
									? 'bg-blue-500 text-white'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
								}`}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>

			{/* Vertical Swing */}
			<div>
				<h4 className="text-sm font-medium text-gray-700 mb-2">Вертикальный поворот</h4>
				<div className="grid grid-cols-2 gap-2">
					{verticalOptions.map((option) => (
						<button
							key={option.value}
							onClick={() => onSwingVertChange(option.value)}
							className={`p-2 rounded text-xs transition-all duration-200 ${swingVert === option.value
									? 'bg-blue-500 text-white'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
								}`}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>
		</div>
	)
}

export default SwingControl 