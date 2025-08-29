import {
  Body,
  Button,
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

type PasswordResetEmailProps = {
  resetToken: string
  userEmail: string
  userName?: string
  siteName?: string
  siteLogo?: string
}

export default function PasswordResetEmail({
  resetToken,
  userEmail,
  userName = 'there',
  siteName = 'BCS',
  siteLogo = '/icons/logo.svg',
}: PasswordResetEmailProps) {
  const resetUrl = `${SERVER_URL}/reset-password/${resetToken}`

  return (
    <Html>
      <Head />
      <Preview>Reset your password for {siteName}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Section className="mt-[32px]">
              <Img
                src={siteLogo.startsWith('http') ? siteLogo : `${SERVER_URL}${siteLogo}`}
                width="40"
                height="37"
                alt={siteName}
                className="my-0 mx-auto"
              />
            </Section>
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Reset your password
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {userName},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              We received a request to reset the password for your {siteName} account ({userEmail}).
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Click the button below to reset your password. This link will expire in 15 minutes for security reasons.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={resetUrl}
              >
                Reset Password
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              If the button doesn't work, you can copy and paste this link into your browser:
            </Text>
            <Text className="text-black text-[14px] leading-[24px] break-all">
              <Link href={resetUrl} className="text-blue-600 no-underline">
                {resetUrl}
              </Link>
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Best regards,<br />
              The {siteName} Team
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
