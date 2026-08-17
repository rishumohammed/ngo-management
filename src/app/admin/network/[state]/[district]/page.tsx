import { Metadata } from 'next'
import DistrictNetworkClient from './DistrictNetworkClient'

export const metadata: Metadata = {
  title: 'District Network',
}

export default function DistrictNetworkPage({ params }: { params: { state: string, district: string } }) {
  return <DistrictNetworkClient state={decodeURIComponent(params.state)} district={decodeURIComponent(params.district)} />
}
