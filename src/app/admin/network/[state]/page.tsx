import { Metadata } from 'next'
import StateNetworkClient from './StateNetworkClient'

export const metadata: Metadata = {
  title: 'State Network',
}

export default function StateNetworkPage({ params }: { params: { state: string } }) {
  return <StateNetworkClient state={decodeURIComponent(params.state)} />
}
