import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { isServiceAccountActive } from "../../src/lib/firebase/auth/access";
import { can } from "../../src/lib/permissions/can";
import type {
  ArtistMembershipDocument,
  LabelArtistRelationDocument,
  LabelMembershipDocument,
} from "../../src/types/firestore";

const timestamp = {
  seconds: 0,
  nanoseconds: 0,
  toDate: () => new Date(0),
};

const artistMembership = (
  role: "owner" | "manager" | "editor" | "viewer",
  artistId = "artist-a",
): ArtistMembershipDocument => ({
  userId: "user-a",
  artistId,
  role,
  status: "active",
  invitedBy: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  schemaVersion: 1,
});

const labelMembership: LabelMembershipDocument = {
  userId: "user-a",
  labelId: "label-a",
  role: "manager",
  status: "active",
  invitedBy: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  schemaVersion: 1,
};

const labelRelation: LabelArtistRelationDocument = {
  labelId: "label-a",
  artistId: "artist-a",
  status: "active",
  permissions: {
    manageProfile: true,
    manageReleases: true,
    manageTracks: true,
    publish: true,
  },
  joinedAt: timestamp,
  endedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  schemaVersion: 1,
};

describe("central permission engine", () => {
  test("a normal user cannot enter management or admin capabilities", () => {
    assert.equal(can({ isAdmin: false }, "artist:view"), false);
    assert.equal(can({ isAdmin: false }, "platform:admin"), false);
  });

  test("an artist owner can edit and publish their artist", () => {
    const context = {
      isAdmin: false,
      artistMembership: artistMembership("owner"),
    };
    assert.equal(can(context, "artist:edit"), true);
    assert.equal(can(context, "release:publish"), true);
    assert.equal(can(context, "artist:manage-team"), true);
  });

  test("an artist editor can edit but cannot publish or manage the team", () => {
    const context = {
      isAdmin: false,
      artistMembership: artistMembership("editor"),
    };
    assert.equal(can(context, "release:edit"), true);
    assert.equal(can(context, "release:publish"), false);
    assert.equal(can(context, "artist:manage-team"), false);
  });

  test("a viewer can inspect a workspace without changing catalog data", () => {
    const context = {
      isAdmin: false,
      artistMembership: artistMembership("viewer"),
    };
    assert.equal(can(context, "artist:view"), true);
    assert.equal(can(context, "analytics:view"), true);
    assert.equal(can(context, "release:edit"), false);
    assert.equal(can(context, "track:create"), false);
  });

  test("an explicit override is applied on top of a role preset", () => {
    const membership = artistMembership("editor");
    membership.permissionOverrides = { publish: true };
    assert.equal(
      can({ isAdmin: false, artistMembership: membership }, "release:publish"),
      true,
    );
  });

  test("a label manager can manage only an actively linked artist", () => {
    assert.equal(
      can(
        {
          isAdmin: false,
          labelMembership,
          labelArtistRelation: labelRelation,
        },
        "release:publish",
      ),
      true,
    );
    assert.equal(
      can({ isAdmin: false, labelMembership }, "release:publish"),
      false,
    );
  });

  test("permissions consider every active label path to the same artist", () => {
    const readOnlyMembership: LabelMembershipDocument = {
      ...labelMembership,
      labelId: "label-read-only",
      role: "editor",
    };
    const readOnlyRelation: LabelArtistRelationDocument = {
      ...labelRelation,
      labelId: "label-read-only",
    };
    assert.equal(
      can(
        {
          isAdmin: false,
          labelPaths: [
            {
              membership: readOnlyMembership,
              relation: readOnlyRelation,
            },
            { membership: labelMembership, relation: labelRelation },
          ],
        },
        "release:publish",
      ),
      true,
    );
  });

  test("an admin can perform every platform action", () => {
    assert.equal(can({ isAdmin: true }, "platform:admin"), true);
    assert.equal(can({ isAdmin: true }, "release:publish"), true);
  });
});

describe("account access", () => {
  test("suspended and deleted users cannot access the service", () => {
    assert.equal(isServiceAccountActive("active"), true);
    assert.equal(isServiceAccountActive("suspended"), false);
    assert.equal(isServiceAccountActive("deleted"), false);
  });
});
