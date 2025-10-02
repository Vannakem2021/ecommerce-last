import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

type EmailVerificationOTPProps = {
  otp: string
  userEmail: string
  userName?: string
  siteName?: string
  siteLogo?: string
  expiresInMinutes?: number
}

export default function EmailVerificationOTP({
  otp,
  userEmail,
  userName = 'there',
  siteName = 'BCS',
  siteLogo = '/icons/logo.svg',
  expiresInMinutes = 10,
}: EmailVerificationOTPProps) {
  return (
    <Html>
      <Head />
      <Preview>Your verification code is {otp}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            {/* Logo */}
            <Section className="mt-[32px]">
              <Img
                src={siteLogo.startsWith('http') ? siteLogo : `${SERVER_URL}${siteLogo}`}
                width="40"
                height="37"
                alt={siteName}
                className="my-0 mx-auto"
              />
            </Section>

            {/* Heading */}
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Verify Your Email Address
            </Heading>

            {/* Greeting */}
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {userName},
            </Text>

            {/* Instructions */}
            <Text className="text-black text-[14px] leading-[24px]">
              Thank you for signing up for {siteName}! To complete your registration,
              please enter the verification code below:
            </Text>

            {/* OTP Display - Large and Prominent */}
            <Section className="text-center my-[32px]">
              <div
                style={{
                  backgroundColor: '#f4f4f4',
                  borderRadius: '8px',
                  padding: '24px',
                  display: 'inline-block',
                }}
              >
                <Text
                  style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    letterSpacing: '0.5em',
                    margin: '0',
                    color: '#000000',
                    fontFamily: 'monospace',
                  }}
                >
                  {otp}
                </Text>
              </div>
            </Section>

            {/* Expiration Warning */}
            <Text className="text-black text-[14px] leading-[24px] text-center">
              ⏱️ This code expires in <strong>{expiresInMinutes} minutes</strong>
            </Text>

            {/* Security Notice */}
            <Section
              style={{
                backgroundColor: '#fff9e6',
                border: '1px solid #ffe066',
                borderRadius: '4px',
                padding: '16px',
                marginTop: '24px',
                marginBottom: '24px',
              }}
            >
              <Text
                style={{
                  fontSize: '12px',
                  lineHeight: '20px',
                  margin: '0',
                  color: '#666666',
                }}
              >
                🔒 <strong>Security Tip:</strong> Never share this code with anyone.
                {siteName} will never ask for your verification code.
              </Text>
            </Section>

            {/* Didn't Request */}
            <Text className="text-black text-[14px] leading-[24px]">
              If you didn&apos;t create an account with {siteName}, you can safely ignore
              this email.
            </Text>

            {/* Help Text */}
            <Text
              style={{
                color: '#666666',
                fontSize: '12px',
                lineHeight: '20px',
                marginTop: '32px',
              }}
            >
              Need help? Contact us at{' '}
              <Link
                href={`mailto:support@${siteName.toLowerCase().replace(/\s+/g, '')}.com`}
                className="text-blue-600"
              >
                support@{siteName.toLowerCase().replace(/\s+/g, '')}.com
              </Link>
            </Text>

            {/* Signature */}
            <Text className="text-black text-[14px] leading-[24px]">
              Best regards,
              <br />
              The {siteName} Team
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
