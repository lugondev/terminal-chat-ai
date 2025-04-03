import React from 'react'
import styles from './BlinkingPointsBackground.module.css' // We'll create this CSS module next

const BlinkingPointsBackground = () => {
	const numPoints = 50 // Adjust the number of points as needed

	return (
		<div className={styles.container}>
			{Array.from({length: numPoints}).map((_, i) => (
				<div
					key={i}
					className={styles.point}
					style={
						{
							// Set initial position using CSS variables expected by the CSS module
							'--initial-top': `${Math.random() * 100}%`,
							'--initial-left': `${Math.random() * 100}%`,
							// Remove unused animation/movement properties
							// '--random-x': (Math.random() - 0.5) * 2, // Range -1 to 1
							// '--random-y': (Math.random() - 0.5) * 2, // Range -1 to 1
							// animationDelay: `${Math.random() * 5}s`,
							// animationDuration: `${2 + Math.random() * 3}s`, // Blinking speed
						} as React.CSSProperties // Type assertion for custom properties
					}
				/>
			))}
		</div>
	)
}

export default BlinkingPointsBackground
