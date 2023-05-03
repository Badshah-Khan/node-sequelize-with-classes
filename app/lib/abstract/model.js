import _, { isObject } from 'lodash';
import Promise from 'bluebird';
import { DataTypes, QueryTypes } from 'sequelize';
import config from 'config';
import path from 'path';

import { models, db } from '../db';

const PROJECT_ROOT = path.join(__dirname, '..');

/**
 * Parses and returns info about the call stack at the given index.
 */
function getStackInfo(stackIndex) {
  // get call stack, and analyze it
  // get all file, method, and line numbers
  const stacklist = new Error().stack.split('\n').slice(3);
  // stack trace format:
  // http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
  // do not remove the regex expresses to outside of this method (due to a BUG in node.js)
  const stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
  const stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;

  const s = stacklist[stackIndex] || stacklist[0];
  const sp = stackReg.exec(s) || stackReg2.exec(s);

  if (sp && sp.length === 5) {
    return {
      method: sp[1],
      relativePath: path.relative(PROJECT_ROOT, sp[2]),
      line: sp[3],
      pos: sp[4],
      file: path.basename(sp[2]),
      stack: stacklist.join(' '),
    };
  }
  return null;
}

const getTrace = (opts = {}) => {
  const stackInfo = getStackInfo(1);
  if (stackInfo && isObject(opts)) {
    opts.srcPath = `[ ${stackInfo?.method} ( ${stackInfo?.relativePath} : ${stackInfo?.line} ) ]`;
  }
};

const defaultSchema = {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    exclude: {
      input: true,
    },
  },
  _meta: {
    type: DataTypes.VIRTUAL(),
  },
};

const defaultOptions = {};

export default class AbstractModel {
  constructor() {
    this.Model = {};
    this.schema = _.merge(
      {},
      defaultSchema,
      config.has('sequelize.defaultSchema') ? config.get('sequelize.defaultSchema') : {}
    );
    this.options = _.merge(
      {},
      defaultOptions,
      config.has('sequelize.defaultOptions') ? config.get('sequelize.defaultOptions') : {}
    );
  }

  /**
   *
   * @param schema
   * @returns {*}
   */
  mergeSchema(schema = {}) {
    const newSchema = _.merge({}, this.schema, schema);
    this.schema = newSchema;

    return newSchema;
  }

  /**
   *
   * @param options
   * @returns {*}
   */
  mergeOptions(options = {}) {
    const newOptions = _.merge({}, this.options, options);
    this.options = newOptions;

    return newOptions;
  }

  /**
   *
   * @param sequelize
   * @param name
   * @param schema
   * @param options
   * @returns {{}}
   */
  defineModel(sequelize, name, schema, options = {}) {
    this.Model = sequelize.define(name, this.mergeSchema(schema), this.mergeOptions(options));
    this.name = this.getName();
    this.sequelize = this.Model.sequelize;
    this.primaryKeyAttribute = this.Model.primaryKeyAttribute;
    this.associations = this.Model.associations;
    this.associationType = this.Model.associationType;
    this.rawAttributes = this.Model.rawAttributes;
    return this.Model;
  }

  /**
   *
   * @param associate
   */
  defineAssociations(associate) {
    this.Model.associate = () => associate(models);
  }

  /**
   *
   * @returns {{}}
   */
  getModel() {
    return this.Model;
  }

  /**
   *
   * @returns {*}
   */
  getName() {
    return this.Model ? this.Model.name : null;
  }

  /**
   *
   * @returns {string | {tableName: string; schema: string; delimiter: string}}
   */
  getTableName() {
    return this.Model.getTableName();
  }

  /**
   *
   * @param opts
   * @returns {*}
   */
  buildQuery(opts = {}) {
    const finalOpts = { type: QueryTypes.SELECT, ...opts };

    const { type, ...restFinalOpts } = finalOpts;

    let queryType = 'selectQuery';
    if (type === QueryTypes.INSERT) {
      queryType = 'insertQuery';
    } else if (type === QueryTypes.UPDATE) {
      queryType = 'updateQuery';
    } else if (type === QueryTypes.DELETE) {
      queryType = 'deleteQuery';
    }

    // Build query and return it
    return this.Model.queryGenerator[queryType](this.getTableName(), restFinalOpts, this.getModel());
  }

  /**
   *
   * @param query
   * @param opts
   * @returns {void|Promise<any>|undefined}
   */
  query(query, opts = {}) {
    getTrace(opts);
    return db.sequelize.query(query, opts).catch(err => {
      throw err;
    });
  }

  /**
   *
   * @param id
   * @param opts
   * @returns {Promise<T>}
   */
  findById(id, opts = {}) {
    getTrace(opts);
    return this.Model.findByPk(id, opts).catch(err => {
      throw err;
    });
  }

  /**
   *
   * @param opts
   * @returns {Promise<T>}
   */
  findOne(opts = {}) {
    getTrace(opts);
    return this.Model.findOne(opts).catch(err => {
      throw err;
    });
  }

  /**
   *
   * @param opts
   * @returns {Promise<T>}
   */
  findAll(opts = {}) {
    getTrace(opts);
    return this.Model.findAll(opts).catch(err => {
      throw err;
    });
  }

  /**
   *
   * @param opts
   * @returns {Promise<T>}
   */
  findOrCreate(opts = {}) {
    getTrace(opts);
    return this.Model.findOrCreate(opts).catch(err => {
      throw err;
    });
  }

  /**
   *
   * @param opts
   * @returns {void|Promise<any>|undefined}
   */
  count(opts = {}) {
    getTrace(opts);
    const { attributes } = opts;

    if (attributes && attributes.length) {
      opts.attributes = [];
    }
    return this.Model.count(opts).catch(err => {
      throw err;
    });
  }

  /**
   *
   * @param data
   * @param opts
   * @returns {void|Promise<T>|undefined}
   */
  create(data, opts = {}) {
    getTrace(opts);
    if (data) {
      data._meta = {
        isNew: true,
        isUpdate: false,
      };
    }

    if (opts?.user?.id) {
      data.createdBy = opts.user.id;
    }

    return this.Model.create(data, opts).catch(err => {
      throw err;
    });
  }

  /**
   *
   * @param dataList
   * @param opts
   * @returns {*}
   */
  createBulk(dataList, opts = {}) {
    getTrace(opts);
    return Promise.map(dataList, data => this.create(data, opts).catch(e => e), { concurrency: 1 });
  }

  /**
   *
   * @param data
   * @param opts
   * @returns {void|Promise<any>|undefined}
   */
  update(data, opts = {}) {
    getTrace(opts);
    if (data) {
      data._meta = {
        isNew: false,
        isUpdate: true,
        updateId: opts && opts.where && opts.where.id ? opts.where.id : null,
        updateWhere: opts && opts.where ? opts.where : {},
      };
    }

    if (opts.user && opts.user.id) {
      data.updatedBy = opts.user.id;
    }

    return this.Model.update(data, opts).catch(err => {
      throw err;
    });
  }

  /**
   *
   * @param id
   * @param data
   * @param opts
   * @returns {Promise<T>}
   */
  updateById(id, data, opts = {}) {
    getTrace(opts);
    if (data) {
      data._meta = {
        isNew: false,
        isUpdate: true,
        updateId: id,
        updateWhere: opts && opts.where ? opts.where : {},
      };
    }

    if (opts.user && opts.user.id) {
      data.updatedBy = opts.user.id;
    }

    // Extract where from opts
    const { where, ...otherOpts } = opts;

    return this.update(data, { where: { id }, ...otherOpts })
      .then(r => (!_.isArray(r) ? r : this.findById(id, otherOpts)))
      .catch(err => {
        throw err;
      });
  }

  /**
   *
   * @param where
   * @param data
   * @param opts
   * @returns {Promise<T>}
   */
  upsert(where = { id: null }, data = {}, opts = {}) {
    getTrace(opts);
    const mergedData = _.merge({}, where, data);
    if (mergedData.id) {
      delete mergedData.id;
    }
    return this.findOne(_.merge({}, opts, { where })).then(entry =>
      !entry
        ? this.create(mergedData, opts)
            .then(r => {
              if (_.isObject(r)) {
                r.isNew = true;
              }
              return r;
            })
            .catch(err => {
              throw err;
            })
        : this.updateById(entry.id, data, opts)
            .then(r => {
              if (_.isObject(r)) {
                r.isNew = false;
              }
              return r;
            })
            .catch(err => {
              throw err;
            })
    );
  }

  /**
   *
   * @param id
   * @param data
   * @param opts
   * @returns {Promise<T>}
   */
  upsertById(id = null, data, opts = {}) {
    getTrace(opts);
    return this.upsert({ id }, data, opts);
  }

  /**
   *
   * @param name
   * @param data
   * @param opts
   * @returns {Promise<T>}
   */
  upsertByName(name = null, data = {}, opts = {}) {
    getTrace(opts);
    return this.upsert({ name }, data, opts);
  }

  /**
   *
   * @param values
   * @param opts
   * @returns {*}
   */
  upsertBulk(values, opts = {}) {
    getTrace(opts);
    return Promise.map(values, value => this.upsertById(value.id ? value.id : null, value, opts).catch(e => e), {
      concurrency: 1,
    });
  }

  /**
   *
   * @param id
   * @param data
   * @param fieldExceptions
   * @param opts
   * @returns {Promise<T>}
   */
  copyById(id, data, fieldExceptions, opts = {}) {
    getTrace(opts);
    return this.findById(id).then(entry => {
      if (!entry) throw error('Provide a valid id.');

      const defaultFieldExceptions = ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'];

      // Extract where from opts
      const { where, ...otherOpts } = opts;

      return this.create(
        _.merge({}, _.omit(entry.toJSON(), fieldExceptions || defaultFieldExceptions), data),
        otherOpts
      ).catch(err => {
        throw err;
      });
    });
  }

  /**
   *
   * @param ids
   * @param data
   * @param fieldExceptions
   * @param opts
   * @returns {*}
   */
  copyBulk(ids, data, fieldExceptions, opts = {}) {
    getTrace(opts);
    return Promise.map(ids, id => this.copyById(id, data || {}, fieldExceptions, opts).catch(e => e), {
      concurrency: 1,
    });
  }

  /**
   *
   * @param id
   * @returns {Promise<T>}
   */
  destroyById(id, opts = {}) {
    getTrace(opts);
    return this.findById(id)
      .then(data => this.Model.destroy({ where: { id }, ...opts }).then(() => data))
      .catch(err => {
        throw err;
      });
  }

  /**
   *
   * @param id
   * @returns {Promise<T>}
   */
  softDeleteById(id, opts = {}) {
    getTrace(opts);
    return this.findById(id)
      .then(data => this.Model.update({ deletedAt: new Date(), isDeleted: true }, { where: { id } }).then(() => data))
      .catch(err => {
        throw err;
      });
  }

  /**
   *
   * @param ids
   * @returns {*}
   */
  destroyBulk(ids, opts = {}) {
    getTrace(opts);
    return Promise.map(ids, id => this.destroyById(id, opts).catch(e => e), { concurrency: 1 });
  }

}
