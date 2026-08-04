import { renderToBuffer, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { formatCurrency, formatDate } from '@/lib/utils'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  header: {
    borderBottom: '2px solid #00897B',
    paddingBottom: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orgName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#00897B',
  },
  orgDetails: {
    fontSize: 8,
    color: '#555',
    marginTop: 4,
    lineHeight: 1.4,
  },
  receiptTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: '#00695C',
    marginBottom: 4,
  },
  receiptSubtitle: {
    fontSize: 9,
    textAlign: 'center',
    color: '#555',
    marginBottom: 16,
  },
  section: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    borderBottom: '1px solid #E0ECEA',
    paddingVertical: 6,
  },
  rowAlt: {
    flexDirection: 'row',
    borderBottom: '1px solid #E0ECEA',
    paddingVertical: 6,
    backgroundColor: '#F5F7F6',
  },
  label: {
    width: '40%',
    fontFamily: 'Helvetica-Bold',
    color: '#555',
    fontSize: 9,
  },
  value: {
    width: '60%',
    color: '#1a1a1a',
    fontSize: 9,
  },
  amountBox: {
    backgroundColor: '#00897B',
    padding: 12,
    borderRadius: 6,
    marginVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  amountValue: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    marginTop: 24,
    borderTop: '1px solid #E0ECEA',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerNote: {
    fontSize: 7.5,
    color: '#888',
    width: '60%',
    lineHeight: 1.5,
  },
  signatureBlock: {
    alignItems: 'flex-end',
    width: '35%',
  },
  signatureLine: {
    borderTop: '1px solid #333',
    width: 120,
    marginBottom: 4,
  },
  signatureText: {
    fontSize: 8,
    color: '#555',
    textAlign: 'center',
  },
  watermark: {
    position: 'absolute',
    fontSize: 72,
    color: '#E8F5E9',
    top: '40%',
    left: '20%',
    opacity: 0.2,
    transform: 'rotate(-30deg)',
  },
})

interface ReceiptData {
  
  donation: any
  orgData: {
    orgName: string
    orgAddress: string
    orgPan: string
    eightyGNumber: string
    eightyGValidity: string
    signatory: string
    fcraNumber: string
  }
}

export async function generateReceiptPdf({ donation, orgData }: ReceiptData): Promise<Uint8Array> {
  const doc = (
    <Document
      title={`80G Receipt — ${donation.receiptNumber}`}
      author={orgData.orgName}
      subject="Donation Receipt under Section 80G"
    >
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>80G</Text>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.orgName}>{orgData.orgName}</Text>
            <Text style={styles.orgDetails}>{orgData.orgAddress}</Text>
            {orgData.orgPan && <Text style={styles.orgDetails}>PAN: {orgData.orgPan}</Text>}
            {orgData.eightyGNumber && (
              <Text style={styles.orgDetails}>
                80G Registration: {orgData.eightyGNumber}
                {orgData.eightyGValidity ? ` (Valid till: ${formatDate(orgData.eightyGValidity)})` : ''}
              </Text>
            )}
            {orgData.fcraNumber && <Text style={styles.orgDetails}>FCRA: {orgData.fcraNumber}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 9, color: '#555' }}>Receipt No.</Text>
            <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#00897B' }}>
              {donation.receiptNumber}
            </Text>
            <Text style={{ fontSize: 8, color: '#888', marginTop: 2 }}>
              Date: {formatDate(donation.date)}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.receiptTitle}>DONATION RECEIPT</Text>
        <Text style={styles.receiptSubtitle}>
          (Eligible for deduction under Section 80G of the Income Tax Act, 1961)
        </Text>

        {/* Amount Highlight */}
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Amount Received</Text>
          <Text style={styles.amountValue}>{formatCurrency(Number(donation.amount))}</Text>
        </View>

        {/* Donor Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Donor Name</Text>
            <Text style={styles.value}>{donation.donorName}</Text>
          </View>
          {donation.donorPan && (
            <View style={styles.rowAlt}>
              <Text style={styles.label}>PAN</Text>
              <Text style={styles.value}>{donation.donorPan}</Text>
            </View>
          )}
          {donation.donorAddress && (
            <View style={styles.row}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{donation.donorAddress}</Text>
            </View>
          )}
          {donation.donorPhone && (
            <View style={styles.rowAlt}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{donation.donorPhone}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Payment Mode</Text>
            <Text style={styles.value}>{donation.paymentMode}</Text>
          </View>
          {donation.chequeNumber && (
            <View style={styles.rowAlt}>
              <Text style={styles.label}>Cheque / DD No.</Text>
              <Text style={styles.value}>
                {donation.chequeNumber}{donation.bankName ? ` — ${donation.bankName}` : ''}
              </Text>
            </View>
          )}
          {donation.purpose && (
            <View style={styles.row}>
              <Text style={styles.label}>Purpose</Text>
              <Text style={styles.value}>{donation.purpose}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerNote}>
            {'This receipt is valid for claiming deduction under Section 80G of the Income Tax Act, 1961. ' +
              'The donation has been received in good faith and will be used for the charitable activities of the trust. ' +
              'This is a computer-generated receipt and is valid without physical signature unless specified.'}
          </Text>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>{orgData.signatory || 'Authorised Signatory'}</Text>
            <Text style={styles.signatureText}>{orgData.orgName}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )

  return renderToBuffer(doc)
}
