import React from 'react'

const ConnectionStatus = ({ status }) => {
	const getStatusColor = () => {
		switch (status) {
			case 'connected':
				return 'bg-green-500'
			case 'connecting':
				return 'bg-yellow-500'
			case 'error':
				return 'bg-red-500'
			default:
				return 'bg-gray-500'
		}
	}

	const getStatusText = () => {
		switch (status) {
			case 'connected':
				return 'Подключено к кондиционеру'
			case 'connecting':
				return 'Подключение...'
			case 'error':
				return 'Ошибка подключения'
			default:
				return 'Не подключено'
		}
	}

	return (
		<div className="mb-6">
			<div className={`inline-flex items-center px-4 py-2 rounded-full text-white text-sm font-medium ${getStatusColor()}`}>
				<div className={`w-2 h-2 rounded-full mr-2 ${status === 'connected' ? 'animate-pulse' : ''}`}></div>
				{getStatusText()}
			</div>
		</div>
	)
}

export default ConnectionStatus 