/**
 *
 */
class LightUserModel
{
  /**
   * @param id
   * @param name
   * @param roles
   */
  constructor(id, name, roles = []) {
    this.id = id;
    this.name = name;
    this.roles = roles;
  }

  /**
   * @returns {boolean}
   */
  get isGuest() {
    return this.id === null || this.roles.length === 0;
  }

  /**
   * @returns {boolean}
   */
  get isAdmin() {
    return this.roles.indexOf('admin') !== -1;
  }
}

module.exports = LightUserModel;
