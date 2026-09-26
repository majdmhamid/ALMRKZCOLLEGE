import Image from 'next/image'
import React from 'react'

import logo from './logo.png'

/** College logo on the admin login screen. */
export const Logo: React.FC = () => (
  <Image
    src={logo}
    alt="كلية المركز للتأهيل المهني"
    style={{ height: 64, width: 'auto' }}
    priority
  />
)
