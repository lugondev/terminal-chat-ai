import Image from 'next/image'
import {Terminal} from '@/components/terminal'

export default function Home() {
	return (
		<main className='relative min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 flex items-center justify-center overflow-hidden p-4'>
			{/* Castle SVG - Lower z-index */}
			<div className='absolute bottom-0 left-0 w-full z-0'>
				<Image
					src='/images/castle.svg'
					alt='Castle silhouette'
					width={2159} // Use the SVG's original width
					height={396} // Use the SVG's original height
					className='w-full h-auto object-cover' // Make it responsive
					priority // Load the image eagerly
				/>
			</div>

			{/* Terminal - Higher z-index */}
			<div className='relative z-10'>
				<Terminal />
			</div>
		</main>
	)
}
