import React, { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import TemperatureControl from './components/TemperatureControl'
import ModeControl from './components/ModeControl'
import FanControl from './components/FanControl'
import SwingControl from './components/SwingControl'
import PowerControl from './components/PowerControl'
import LightsControl from './components/LightsControl'
import StatusDisplay from './components/StatusDisplay'
import ConnectionStatus from './components/ConnectionStatus'
import ConnectionSettings from './components/ConnectionSettings'

const socket = io()

function App() {
	const [connectionStatus, setConnectionStatus] = useState('disconnected')
	const [deviceStatus, setDeviceStatus] = useState({
		power: 'off',
		mode: 'cool',
		temperature: 25,
		currentTemperature: 0,
		fanSpeed: 'auto',
		swingHor: 'default',
		swingVert: 'default',
		lights: 'off',
		health: 'off',
		sleep: 'off',
		turbo: 'off',
		quiet: 'off',
		blow: 'off',
		air: 'off',
		powerSave: 'off'
	})

	useEffect(() => {
		// Socket event listeners
		socket.on('connect', () => {
			setConnectionStatus('connected')
			console.log('Connected to server')
		})

		socket.on('disconnect', () => {
			setConnectionStatus('disconnected')
			console.log('Disconnected from server')
		})

		socket.on('device_update', (data) => {
			setDeviceStatus(prev => ({ ...prev, ...data }))
		})

		socket.on('connection_status', (status) => {
			setConnectionStatus(status)
		})

		socket.on('error', (error) => {
			console.error('Socket error:', error)
			setConnectionStatus('error')
		})

		return () => {
			socket.off('connect')
			socket.off('disconnect')
			socket.off('device_update')
			socket.off('connection_status')
			socket.off('error')
		}
	}, [])

	const sendCommand = (property, value) => {
		console.log(`Отправка команды: ${property} = ${value}`)
		socket.emit('set_property', { property, value })
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-gray-800 mb-2">
						Gree HVAC Controller
					</h1>
					<p className="text-gray-600">
						Управление кондиционером через веб-интерфейс
					</p>
				</div>

				{/* Connection Status */}
				<ConnectionStatus status={connectionStatus} />

				{/* Connection Settings */}
				<ConnectionSettings
					isConnected={connectionStatus === 'connected'}
					onConnect={() => setConnectionStatus('connecting')}
					onDisconnect={() => setConnectionStatus('disconnected')}
				/>

				{/* Main Control Panel */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
					{/* Left Column */}
					<div className="space-y-6">
						{/* Power Control */}
						<PowerControl
							power={deviceStatus.power}
							onToggle={(value) => sendCommand('power', value)}
						/>

						{/* Temperature Control */}
						<TemperatureControl
							temperature={deviceStatus.temperature}
							currentTemperature={deviceStatus.currentTemperature}
							onTemperatureChange={(value) => sendCommand('temperature', value)}
						/>

						{/* Mode Control */}
						<ModeControl
							mode={deviceStatus.mode}
							onModeChange={(value) => sendCommand('mode', value)}
						/>

						{/* Fan Control */}
						<FanControl
							fanSpeed={deviceStatus.fanSpeed}
							onFanSpeedChange={(value) => sendCommand('fanSpeed', value)}
						/>
					</div>

					{/* Right Column */}
					<div className="space-y-6">
						{/* Swing Control */}
						<SwingControl
							swingHor={deviceStatus.swingHor}
							swingVert={deviceStatus.swingVert}
							onSwingHorChange={(value) => sendCommand('swingHor', value)}
							onSwingVertChange={(value) => sendCommand('swingVert', value)}
						/>

						{/* Status Display */}
						<StatusDisplay deviceStatus={deviceStatus} />

						{/* Lights Control */}
						<LightsControl
							lights={deviceStatus.lights}
							onToggle={(value) => sendCommand('lights', value)}
						/>

						{/* Additional Controls */}
						<div className="bg-white rounded-xl shadow-lg p-6">
							<h3 className="text-lg font-semibold text-gray-800 mb-4">
								Дополнительные функции
							</h3>
							<div className="grid grid-cols-2 gap-4">

								<button
									onClick={() => sendCommand('health', deviceStatus.health === 'on' ? 'off' : 'on')}
									className={`p-3 rounded-lg text-sm font-medium transition-colors ${deviceStatus.health === 'on'
										? 'bg-green-500 text-white'
										: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
										}`}
								>
									{deviceStatus.health === 'on' ? '🦠 Очистка ВКЛ' : '🦠 Очистка ВЫКЛ'}
								</button>

								<button
									onClick={() => sendCommand('turbo', deviceStatus.turbo === 'on' ? 'off' : 'on')}
									className={`p-3 rounded-lg text-sm font-medium transition-colors ${deviceStatus.turbo === 'on'
										? 'bg-red-500 text-white'
										: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
										}`}
								>
									{deviceStatus.turbo === 'on' ? '💨 Турбо ВКЛ' : '💨 Турбо ВЫКЛ'}
								</button>

								<button
									onClick={() => sendCommand('sleep', deviceStatus.sleep === 'on' ? 'off' : 'on')}
									className={`p-3 rounded-lg text-sm font-medium transition-colors ${deviceStatus.sleep === 'on'
										? 'bg-purple-500 text-white'
										: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
										}`}
								>
									{deviceStatus.sleep === 'on' ? '😴 Сон ВКЛ' : '😴 Сон ВЫКЛ'}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default App 