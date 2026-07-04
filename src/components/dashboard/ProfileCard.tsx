import { motion } from 'framer-motion';
import { MapPin, Building2, LinkIcon, Calendar, Users, GitFork } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import type { UserProfileData } from '@/types/github';

interface ProfileCardProps {
  user: UserProfileData['user'];
}

export function ProfileCard({ user }: ProfileCardProps) {
  const stats = [
    { label: 'Followers', value: user.followers.totalCount },
    { label: 'Following', value: user.following.totalCount },
    { label: 'Repos', value: user.repositories.totalCount },
  ];

  const details = [
    { icon: Building2, value: user.company, label: 'Company' },
    { icon: MapPin, value: user.location, label: 'Location' },
    { icon: LinkIcon, value: user.websiteUrl, label: 'Website', isLink: true },
    { icon: Calendar, value: formatDate(user.createdAt), label: 'Joined' },
  ].filter((d) => d.value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <img
          src={user.avatarUrl}
          alt={user.name || user.login}
          className="h-24 w-24 rounded-2xl ring-2 ring-border object-cover"
        />
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-foreground">
            {user.name || user.login}
          </h2>
          <p className="text-muted-foreground mb-3">@{user.login}</p>
          {user.bio && (
            <p className="text-sm text-foreground/80 mb-4 max-w-lg">{user.bio}</p>
          )}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mb-4">
            {stats.map(({ label, value }) => (
              <div key={label} className="flex items-center gap-1.5 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">{value.toLocaleString()}</span>
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            {details.map(({ icon: Icon, value, label, isLink }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5" />
                {isLink ? (
                  <a
                    href={value!.startsWith('http') ? value! : `https://${value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {value}
                  </a>
                ) : (
                  <span>{value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
