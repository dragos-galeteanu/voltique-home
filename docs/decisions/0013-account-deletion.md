# 0013. Deletion is immediate, irreversible and re-authenticated

## Decision

An account can be deleted from inside the app, from settings. The current password is
required. Deletion is immediate and permanent: households the person owns go with their
assets, readings, logs and alerts, and households they were invited to simply lose them.
There is no deactivation and no grace period.

## Why

Both stores require it. Apple rejects apps that let someone create an account but not
delete it, and Google's data safety declarations expect an account deletion path. This was
the only item on the release checklist that was code rather than paperwork.

The password is asked for because the alternative is a two-tap path from an unlocked phone
to an erased account. Re-authentication at the moment of a destructive action is cheap and
is what people expect from anything that cannot be undone.

Immediate rather than a grace period, because a grace period is a promise that something
still exists somewhere, which has to be explained, surfaced and eventually honoured. The
screen says what will happen before the button rather than after it.

## Rejected

**Deactivation with a restore window.** Kinder to someone who changes their mind, and it
keeps their data, which is the opposite of what a deletion request means.

**Deleting through a web page.** Allowed by the stores if the path is obvious, and it moves
the one flow a reviewer will look for out of the app.

**No re-authentication.** One fewer field, and an account that can be destroyed by anyone
holding an unlocked phone.

## Consequences

The API needs the deletion to be genuinely cascading. The contract says so, including what
happens to households the person does not own, because that is the part a backend is most
likely to leave half-done.

After deletion the app signs out, which clears everything stored about that person on the
device through the existing storage scopes. See [0012](0012-storage-scopes.md).
