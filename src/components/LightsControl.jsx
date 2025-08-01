import React from 'react'

const LightsControl = ({ lights, onToggle }) => {
	return (
		<div className="bg-white rounded-xl shadow-lg p-6">
			<h3 className="text-lg font-semibold text-gray-800 mb-4">
				Подсветка
			</h3>
			<div className="flex items-center justify-center">
				<button
					onClick={() => onToggle(lights === 'on' ? 'off' : 'on')}
					className={`relative inline-flex h-16 w-28 items-center justify-center rounded-full transition-all duration-300 ${lights === 'on'
							? 'bg-yellow-500 shadow-lg shadow-yellow-500/50'
							: 'bg-gray-300'
						}`}
				>
					<div className={`absolute left-1 h-12 w-12 rounded-full bg-white shadow-md transition-transform duration-300 ${lights === 'on' ? 'translate-x-12' : 'translate-x-0'
						}`}></div>
					<span className={`text-sm font-medium transition-colors ${lights === 'on' ? 'text-white' : 'text-gray-600'
						}`}>
						{lights === 'on' ? 'ВКЛ' : 'ВЫКЛ'}
					</span>
				</button>
			</div>
		</div>
	)
}

export default LightsControl 