import React from 'react'

const PowerControl = ({ power, onToggle }) => {
	return (
		<div className="bg-white rounded-xl shadow-lg p-6">
			<h3 className="text-lg font-semibold text-gray-800 mb-4">
				Питание
			</h3>
			<div className="flex items-center justify-center">
				<button
					onClick={() => onToggle(power === 'on' ? 'off' : 'on')}
					className={`relative inline-flex h-16 w-28 items-center justify-center rounded-full transition-all duration-300 ${power === 'on'
							? 'bg-green-500 shadow-lg shadow-green-500/50'
							: 'bg-gray-300'
						}`}
				>
					<div className={`absolute left-1 h-12 w-12 rounded-full bg-white shadow-md transition-transform duration-300 ${power === 'on' ? 'translate-x-12' : 'translate-x-0'
						}`}></div>
					<span className={`text-sm font-medium transition-colors ${power === 'on' ? 'text-white' : 'text-gray-600'
						}`}>
						{power === 'on' ? 'ВКЛ' : 'ВЫКЛ'}
					</span>
				</button>
			</div>
		</div>
	)
}

export default PowerControl 