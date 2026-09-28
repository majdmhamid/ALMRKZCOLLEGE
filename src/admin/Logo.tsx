import Image from 'next/image'
import React from 'react'

import logo from './logo.png'
import mark from './logo-mark.png'

/** College logo on the admin login screen. */
export const Logo: React.FC = () => (
  <Image
    src={logo}
    alt="كلية المركز للتأهيل المهني"
    style={{ height: 64, width: 'auto' }}
    priority
  />
)

/** Small college logo in the top bar (instead of the Payload mark). */
export const Icon: React.FC = () => (
  <Image src={mark} alt="كلية المركز" width={24} height={26} style={{ objectFit: 'contain', display: 'block' }} />
)
