class LightUserModel {
  constructor(id, name, roles = []) {
    this.id = id;
    this.name = name;
    this.roles = roles;
  }

  get isGuest() {
    return this.roles.includes(LightUserModel.ROLE_GUEST);
  }

  get isRoot() {
    return this.roles.includes(LightUserModel.ROLE_ROOT);
  }

  get isAdmin() {
    return this.roles.includes(LightUserModel.ROLE_ADMIN);
  }

  get isDJ() {
    return this.roles.includes(LightUserModel.ROLE_DJ);
  }

  get isElevated() {
    return this.isDJ || this.isAdmin || this.isRoot;
  }
}

// statics
LightUserModel.ROLE_ADMIN = 'admin';
LightUserModel.ROLE_GUEST = 'guest';
LightUserModel.ROLE_DJ = 'dj';
LightUserModel.ROLE_ROOT = 'root';

module.exports = LightUserModel;
