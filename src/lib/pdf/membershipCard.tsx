import { renderToBuffer, Document, Page, Text, View, StyleSheet, Image, Svg, Path } from '@react-pdf/renderer'
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
  backgroundCircle: {
    position: 'absolute',
    width: 430,
    height: 430,
    right: -260,
    top: 130,
    borderRadius: 215,
    backgroundColor: 'rgba(28,75,120,0.07)',
  },
  sideMessage: {
    position: 'absolute',
    left: 16,
    top: 240,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  sideMessageLine: {
    fontSize: 5.5,
    lineHeight: 1.6,
    letterSpacing: 2,
    color: '#a0adbc',
    textTransform: 'uppercase',
  },
  top: {
    position: 'absolute',
    top: 30,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoBox: {
    width: 100,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logoImage: {
    width: 95,
    height: 46,
    objectFit: 'contain',
  },
  logoText: {
    fontSize: 8,
    color: '#708198',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  topRightText: {
    textAlign: 'right',
  },
  topRightLine: {
    fontSize: 7.5,
    lineHeight: 1.7,
    letterSpacing: 3,
    color: '#718198',
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  foundationSection: {
    position: 'absolute',
    top: 96,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  foundationName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 4.5,
    color: '#102d54',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  foundationTagline: {
    marginTop: 5,
    fontSize: 7.5,
    letterSpacing: 2.5,
    color: '#718198',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  foundationDivider: {
    width: 30,
    height: 1,
    marginTop: 10,
    backgroundColor: '#102d54',
  },
  memberSection: {
    position: 'absolute',
    top: 175,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  memberName: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2.5,
    color: '#102d54',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  memberRole: {
    marginTop: 6,
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 4,
    color: '#718198',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  memberLine: {
    width: 30,
    height: 1,
    marginVertical: 10,
    backgroundColor: '#102d54',
  },
  memberMessageLine: {
    fontSize: 8,
    lineHeight: 1.7,
    letterSpacing: 3,
    color: '#405776',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  infoContainer: {
    position: 'absolute',
    top: 320,
    left: 36,
    right: 36,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dce4ed',
  },
  infoCol: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 7,
    letterSpacing: 3,
    color: '#718198',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  infoValue: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    color: '#14243b',
    textAlign: 'center',
  },
  infoDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#dce4ed',
  },
  mottoBand: {
    position: 'absolute',
    top: 388,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mottoBandText: {
    fontSize: 6.5,
    letterSpacing: 2.5,
    color: '#526B88',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  signatureSection: {
    position: 'absolute',
    left: 36,
    bottom: 85,
  },
  signatureBox: {
    width: 135,
    height: 38,
    justifyContent: 'flex-end',
  },
  signatureImage: {
    maxWidth: 135,
    maxHeight: 38,
    objectFit: 'contain',
  },
  signaturePlaceholder: {
    width: 135,
    height: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#718198',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
  },
  signaturePlaceholderText: {
    fontSize: 7,
    letterSpacing: 2,
    color: '#a0adbc',
  },
  signatureLabel: {
    marginTop: 5,
    fontSize: 6.5,
    letterSpacing: 2,
    color: '#718198',
    textTransform: 'uppercase',
  },
  qrSection: {
    position: 'absolute',
    right: 36,
    bottom: 85,
    alignItems: 'flex-end',
  },
  qrBox: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrImage: {
    width: 64,
    height: 64,
    objectFit: 'contain',
  },
  qrPlaceholder: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: '#718198',
    borderStyle: 'dashed',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    fontSize: 7,
    letterSpacing: 1,
    color: '#a0adbc',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 55,
    backgroundColor: '#102d54',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  footerName: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLeftText: {
    fontSize: 7,
    letterSpacing: 1.5,
    color: '#ffffff',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRightText: {
    fontSize: 7,
    letterSpacing: 1.5,
    color: '#ffffff',
  },
  footerIcon: {
    width: 9,
    height: 9,
    marginRight: 4,
  },
})

interface MembershipCardProps {
  member: {
    name: string
    memberNumber: string
    membershipType: string
    joinDate: string | Date
    phone?: string | null
    email?: string | null
    district?: string | null
    state?: string | null
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

export async function generateMembershipCardPdf({ member, orgData }: MembershipCardProps): Promise<Uint8Array> {
  const logoPath = resolveImagePath(orgData.orgLogo)
  const signaturePath = resolveImagePath(orgData.orgSignature)
  const qrPath = resolveImagePath(orgData.orgQrCode)

  const roleText = member.membershipType ? `${member.membershipType.toUpperCase()} MEMBER` : 'COMMUNITY MEMBER'
  const locationText = member.district && member.state ? `${member.district.toUpperCase()}, ${member.state.toUpperCase()}` : 'KERALA, INDIA'

  const doc = (
    <Document title={`Membership Card — ${member.memberNumber}`} author={orgData.orgName}>
      <Page size={[450, 600]} style={styles.page}>
        {/* Background Accent */}
        <View style={styles.backgroundCircle} />

        {/* Side vertical text message */}
        <View style={styles.sideMessage}>
          <Text style={styles.sideMessageLine}>A</Text>
          <Text style={styles.sideMessageLine}>KINDER</Text>
          <Text style={styles.sideMessageLine}>BRIGHTER</Text>
          <Text style={styles.sideMessageLine}>STRONGER</Text>
          <Text style={styles.sideMessageLine}>YOU</Text>
        </View>

        {/* Top Header */}
        <View style={styles.top}>
          <View style={styles.logoBox}>
            {logoPath ? (
              <Image src={logoPath} style={styles.logoImage} />
            ) : (
              <Text style={styles.logoText}>LOGO HERE</Text>
            )}
          </View>
          <View style={styles.topRightText}>
            <Text style={styles.topRightLine}>PEOPLE</Text>
            <Text style={styles.topRightLine}>MINDS</Text>
            <Text style={styles.topRightLine}>BRIGHTER</Text>
            <Text style={styles.topRightLine}>TOMORROWS</Text>
          </View>
        </View>

        {/* Foundation Info */}
        <View style={styles.foundationSection}>
          <Text style={styles.foundationName}>{orgData.orgName || 'FREE MIND FOUNDATION'}</Text>
          <Text style={styles.foundationTagline}>FREEING MINDS THROUGH AWARENESS</Text>
          <View style={styles.foundationDivider} />
        </View>

        {/* Member Section */}
        <View style={styles.memberSection}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberRole}>{roleText}</Text>
          <View style={styles.memberLine} />
          <Text style={styles.memberMessageLine}>TOGETHER FOR</Text>
          <Text style={styles.memberMessageLine}>A BRIGHTER TOMORROW</Text>
        </View>

        {/* Member Info Box */}
        <View style={styles.infoContainer}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>MEMBER ID</Text>
            <Text style={styles.infoValue}>{member.memberNumber}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>JOINED DATE</Text>
            <Text style={styles.infoValue}>{formatDate(member.joinDate).toUpperCase()}</Text>
          </View>
        </View>

        {/* Motto / Location Band */}
        <View style={styles.mottoBand}>
          <Text style={styles.mottoBandText}>PREVENTIVE MENTAL WELLNESS  •  {locationText}</Text>
        </View>

        {/* Signature */}
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

        {/* QR Code */}
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

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerName}>
            <Svg viewBox="0 0 24 24" style={styles.footerIcon}>
              <Path fill="#ffffff" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </Svg>
            <Text style={styles.footerLeftText}>freemindfoundation.org.in</Text>
          </View>
          <View style={styles.footerRight}>
            <Svg viewBox="0 0 24 24" style={styles.footerIcon}>
              <Path fill="#ffffff" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </Svg>
            <Text style={styles.footerRightText}>+91-7306445994</Text>
          </View>
        </View>
      </Page>
    </Document>
  )

  return renderToBuffer(doc)
}
