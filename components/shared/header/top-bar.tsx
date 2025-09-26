import Container from '@/components/shared/container'
import { getSetting } from '@/lib/actions/setting.actions'
import LanguageSwitcher from './language-switcher'
import UserButton from './user-button'

export default async function TopBar({ showPhoneOnly = false }: { showPhoneOnly?: boolean }) {
  const setting = await getSetting()

  if (showPhoneOnly) {
    return (
      <>
        {setting.site?.phone && (
          <>
            <span className="text-xs">📞</span>
            <span className="text-xs">{setting.site.phone}</span>
          </>
        )}
      </>
    )
  }

  return (
    <div className="bg-green-600 text-white">
      <Container padding="sm">
        <div className="flex items-center justify-between h-10">
          {/* Left side - Phone number */}
          <div className="flex items-center gap-2 text-sm">
            {setting.site?.phone && (
              <>
                <span>Phone:</span>
                <span>{setting.site.phone}</span>
              </>
            )}
          </div>

          {/* Right side - Language switcher and User button (desktop only) */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher />
            <UserButton />
          </div>
        </div>
      </Container>
    </div>
  )
}