import { renderToBuffer, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { formatDate } from '@/lib/utils'
import { join } from 'path'
import { existsSync } from 'fs'

function resolveImagePath(imgPath?: string): string | null {
  if (!imgPath || typeof imgPath !== 'string') return null
  const trimmed = imgPath.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('data:image')) return trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed

  const relativePath = trimmed
    .replace(/^\/api\/uploads\//, 'uploads/')
    .replace(/^\/uploads\//, 'uploads/')
    .replace(/^\//, '')

  const absolutePath = join(process.cwd(), 'public', relativePath)
  if (existsSync(absolutePath)) {
    return absolutePath
  }
  return null
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    padding: 0,
    backgroundColor: '#ffffff',
    position: 'relative',
    width: 450,
    height: 600,
  },
  brandPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 92,
    backgroundColor: '#08284D',
  },
  panelTop: {
    position: 'absolute',
    left: 18,
    top: 45,
  },
  panelTopLineText: {
    fontSize: 6.5,
    lineHeight: 1.8,
    letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
  },
  panelTopGoldLine: {
    width: 25,
    height: 2,
    marginTop: 10,
    backgroundColor: '#C9A24A',
  },
  panelMiddle: {
    position: 'absolute',
    left: 18,
    top: 240,
  },
  panelMiddleLineText: {
    fontSize: 6.5,
    lineHeight: 1.8,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
  panelBottom: {
    position: 'absolute',
    left: 18,
    bottom: 28,
  },
  panelBottomLineText: {
    fontSize: 6.5,
    lineHeight: 1.8,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
  },
  panelBottomGoldLine: {
    width: 25,
    height: 1,
    marginTop: 8,
    backgroundColor: '#C9A24A',
  },
  content: {
    position: 'absolute',
    left: 92,
    right: 0,
    top: 0,
    bottom: 0,
    paddingTop: 28,
    paddingHorizontal: 28,
  },
  top: {
    position: 'absolute',
    top: 28,
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoBox: {
    width: 90,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logoImage: {
    width: 85,
    height: 44,
    objectFit: 'contain',
  },
  logoText: {
    fontSize: 7,
    color: '#718297',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  topRightText: {
    textAlign: 'right',
    alignItems: 'flex-end',
  },
  topRightLine: {
    fontSize: 6.5,
    lineHeight: 1.6,
    letterSpacing: 2.5,
    color: '#718297',
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  goldLine: {
    width: 25,
    height: 2,
    marginTop: 6,
    backgroundColor: '#C9A24A',
  },
  foundationSection: {
    position: 'absolute',
    top: 110,
    left: 28,
    right: 28,
    alignItems: 'center',
  },
  foundationName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 4.5,
    color: '#08284D',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  foundationTagline: {
    marginTop: 5,
    fontSize: 6.5,
    letterSpacing: 2.5,
    color: '#718297',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  foundationLine: {
    width: 30,
    height: 1,
    marginTop: 10,
    backgroundColor: '#08284D',
  },
  identitySection: {
    position: 'absolute',
    top: 188,
    left: 28,
    right: 28,
    alignItems: 'center',
  },
  designationText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 5,
    color: '#155487',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  volunteerName: {
    marginTop: 8,
    fontSize: 25,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    color: '#08284D',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  nameUnderline: {
    width: 35,
    height: 2,
    marginTop: 10,
    backgroundColor: '#C9A24A',
  },
  identityMessage: {
    marginTop: 10,
    fontSize: 7,
    letterSpacing: 2.5,
    color: '#526A82',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  infoContainer: {
    position: 'absolute',
    top: 306,
    left: 28,
    right: 28,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E1E9',
  },
  infoCol: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 6,
    letterSpacing: 2.5,
    color: '#718297',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  infoValue: {
    marginTop: 4,
    fontSize: 11.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    color: '#10263E',
    textAlign: 'center',
  },
  infoDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#D8E1E9',
  },
  purposeBand: {
    position: 'absolute',
    top: 380,
    left: 28,
    right: 28,
    alignItems: 'center',
  },
  purposeText: {
    fontSize: 7,
    lineHeight: 1.7,
    letterSpacing: 2.5,
    color: '#526B88',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  purposeSubText: {
    marginTop: 2,
    fontSize: 6,
    letterSpacing: 2,
    color: '#8AA0B5',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  signatureSection: {
    position: 'absolute',
    left: 28,
    bottom: 72,
  },
  signatureBox: {
    width: 135,
    height: 38,
    justifyContent: 'flex-end',
  },
  signatureImage: {
    maxWidth: 130,
    maxHeight: 36,
    objectFit: 'contain',
  },
  signaturePlaceholder: {
    width: 130,
    height: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#72859A',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
  },
  signaturePlaceholderText: {
    fontSize: 6,
    letterSpacing: 2,
    color: '#9BA8B6',
  },
  signatureLabel: {
    marginTop: 5,
    fontSize: 6,
    letterSpacing: 2.5,
    color: '#718297',
    textTransform: 'uppercase',
  },
  qrSection: {
    position: 'absolute',
    right: 28,
    bottom: 72,
    alignItems: 'flex-end',
  },
  qrBox: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrImage: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  qrPlaceholder: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#72859A',
    borderStyle: 'dashed',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    fontSize: 7,
    letterSpacing: 1,
    color: '#9BA8B6',
  },
  footer: {
    position: 'absolute',
    left: 92,
    right: 0,
    bottom: 0,
    height: 48,
    backgroundColor: '#08284D',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  footerLeft: {
    fontSize: 6.5,
    letterSpacing: 1.2,
    color: '#ffffff',
  },
  footerRight: {
    fontSize: 6.5,
    letterSpacing: 1.2,
    color: '#ffffff',
    textAlign: 'right',
  },
})

interface VolunteerCardProps {
  volunteer: {
    id: string
    name: string
    email?: string | null
    approvedAt?: string | Date | null
    phone?: string | null
    district?: string | null
    state?: string | null
    contributionType?: string | null
    volunteerNumber?: string | null
  }
  orgData: {
    orgName: string
    orgLogo?: string
    orgSignature?: string
    orgQrCode?: string
    signatory?: string
    signatoryTitle?: string
  }
}

export async function generateVolunteerCardPdf({ volunteer, orgData }: VolunteerCardProps): Promise<Uint8Array> {
  const logoPath = resolveImagePath(orgData.orgLogo)
  const signaturePath = resolveImagePath(orgData.orgSignature)
  const qrPath = resolveImagePath(orgData.orgQrCode)

  const volunteerIdDisplay = volunteer.volunteerNumber || `FMFV0001`
  const dateDisplay = volunteer.approvedAt ? formatDate(volunteer.approvedAt).toUpperCase() : '07 SEP 2026'

  const doc = (
    <Document title={`Volunteer Card — ${volunteer.name}`} author={orgData.orgName}>
      <Page size={[450, 600]} style={styles.page}>
        {/* Left Brand Panel */}
        <View style={styles.brandPanel}>
          <View style={styles.panelTop}>
            <Text style={styles.panelTopLineText}>PEOPLE</Text>
            <Text style={styles.panelTopLineText}>MINDS</Text>
            <Text style={styles.panelTopLineText}>BRIGHTER</Text>
            <Text style={styles.panelTopLineText}>TOMORROWS</Text>
            <View style={styles.panelTopGoldLine} />
          </View>
          <View style={styles.panelMiddle}>
            <Text style={styles.panelMiddleLineText}>GIVE</Text>
            <Text style={styles.panelMiddleLineText}>YOUR TIME</Text>
            <Text style={styles.panelMiddleLineText}>CREATE</Text>
            <Text style={styles.panelMiddleLineText}>POSITIVE</Text>
            <Text style={styles.panelMiddleLineText}>CHANGE</Text>
          </View>
          <View style={styles.panelBottom}>
            <Text style={styles.panelBottomLineText}>KINDER</Text>
            <Text style={styles.panelBottomLineText}>MINDS</Text>
            <Text style={styles.panelBottomLineText}>STRONGER</Text>
            <Text style={styles.panelBottomLineText}>COMMUNITIES</Text>
            <View style={styles.panelBottomGoldLine} />
          </View>
        </View>

        {/* Main Content Area */}
        <View style={styles.content}>
          {/* Top Section */}
          <View style={styles.top}>
            <View style={styles.logoBox}>
              {logoPath ? (
                <Image src={logoPath} style={styles.logoImage} />
              ) : (
                <Text style={styles.logoText}>LOGO HERE</Text>
              )}
            </View>
            <View style={styles.topRightText}>
              <Text style={styles.topRightLine}>SUPPORT</Text>
              <Text style={styles.topRightLine}>AWARENESS</Text>
              <Text style={styles.topRightLine}>COMMUNITY</Text>
              <Text style={styles.topRightLine}>CHANGE</Text>
              <View style={styles.goldLine} />
            </View>
          </View>

          {/* Foundation Header */}
          <View style={styles.foundationSection}>
            <Text style={styles.foundationName}>{orgData.orgName || 'FREE MIND FOUNDATION'}</Text>
            <Text style={styles.foundationTagline}>FREEING MINDS THROUGH AWARENESS</Text>
            <View style={styles.foundationLine} />
          </View>

          {/* Identity Section */}
          <View style={styles.identitySection}>
            <Text style={styles.designationText}>— VOLUNTEER —</Text>
            <Text style={styles.volunteerName}>{volunteer.name}</Text>
            <View style={styles.nameUnderline} />
            <Text style={styles.identityMessage}>PEOPLE · PURPOSE · POSITIVE CHANGE</Text>
          </View>

          {/* Information Box */}
          <View style={styles.infoContainer}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>VOLUNTEER ID</Text>
              <Text style={styles.infoValue}>{volunteerIdDisplay}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>JOINED ON</Text>
              <Text style={styles.infoValue}>{dateDisplay}</Text>
            </View>
          </View>

          {/* Purpose Statement */}
          <View style={styles.purposeBand}>
            <Text style={styles.purposeText}>TOGETHER FOR A BRIGHTER TOMORROW</Text>
            <Text style={styles.purposeSubText}>COMMUNITY OUTREACH & MENTAL WELLNESS</Text>
          </View>

          {/* Signature Block */}
          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              {signaturePath ? (
                <Image src={signaturePath} style={styles.signatureImage} />
              ) : (
                <View style={styles.signaturePlaceholder}>
                  <Text style={styles.signaturePlaceholderText}>SIGNATURE</Text>
                </View>
              )}
            </View>
            <Text style={styles.signatureLabel}>AUTHORIZED SIGNATURE</Text>
          </View>

          {/* QR Code Block */}
          <View style={styles.qrSection}>
            <View style={styles.qrBox}>
              {qrPath ? (
                <Image src={qrPath} style={styles.qrImage} />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.qrPlaceholderText}>QR CODE</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLeft}>freemindfoundation.org.in</Text>
          <Text style={styles.footerRight}>+91-7306445994</Text>
        </View>
      </Page>
    </Document>
  )

  return renderToBuffer(doc)
}
