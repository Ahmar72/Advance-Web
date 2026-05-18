import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['super_admin', 'election_creator', 'voter']);
export const electionStatusEnum = pgEnum('election_status', ['draft', 'published', 'completed']);
export const requestStatusEnum = pgEnum('request_status', ['pending', 'approved', 'rejected']);
export const registrationStatusEnum = pgEnum('registration_status', ['registered', 'voted']);

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  role: userRoleEnum('role').default('voter').notNull(),
  organization: text('organization'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const electionRequests = pgTable('election_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').references(() => profiles.id).notNull(),
  purpose: text('purpose').notNull(),
  organization: text('organization').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  status: requestStatusEnum('status').default('pending').notNull(),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const elections = pgTable('elections', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').references(() => profiles.id).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  registrationDeadline: timestamp('registration_deadline').notNull(),
  maxVoters: integer('max_voters').notNull(),
  status: electionStatusEnum('status').default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const polls = pgTable('polls', {
  id: uuid('id').defaultRandom().primaryKey(),
  electionId: uuid('election_id').references(() => elections.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const candidates = pgTable('candidates', {
  id: uuid('id').defaultRandom().primaryKey(),
  pollId: uuid('poll_id').references(() => polls.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  designation: text('designation').notNull(),
  manifesto: text('manifesto').notNull(),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const registrations = pgTable('registrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  pollId: uuid('poll_id').references(() => polls.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  secretId: text('secret_id').notNull(),
  status: registrationStatusEnum('status').default('registered').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const votes = pgTable('votes', {
  id: uuid('id').defaultRandom().primaryKey(),
  pollId: uuid('poll_id').references(() => polls.id, { onDelete: 'cascade' }).notNull(),
  candidateId: uuid('candidate_id').references(() => candidates.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: uuid('target_id'),
  metadata: text('metadata'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  elections: many(elections),
  requests: many(electionRequests),
  registrations: many(registrations),
}));

export const electionRequestsRelations = relations(electionRequests, ({ one }) => ({
  creator: one(profiles, {
    fields: [electionRequests.creatorId],
    references: [profiles.id],
  }),
}));

export const electionsRelations = relations(elections, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [elections.creatorId],
    references: [profiles.id],
  }),
  polls: many(polls),
}));

export const pollsRelations = relations(polls, ({ one, many }) => ({
  election: one(elections, {
    fields: [polls.electionId],
    references: [elections.id],
  }),
  candidates: many(candidates),
  registrations: many(registrations),
  votes: many(votes),
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  poll: one(polls, {
    fields: [candidates.pollId],
    references: [polls.id],
  }),
  votes: many(votes),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  poll: one(polls, {
    fields: [registrations.pollId],
    references: [polls.id],
  }),
  user: one(profiles, {
    fields: [registrations.userId],
    references: [profiles.id],
  }),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  poll: one(polls, {
    fields: [votes.pollId],
    references: [polls.id],
  }),
  candidate: one(candidates, {
    fields: [votes.candidateId],
    references: [candidates.id],
  }),
}));

