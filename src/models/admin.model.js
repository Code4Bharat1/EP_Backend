import {sequelizeCon,DataTypes} from "../init/dbConnection.js"; 


const Admin = sequelizeCon.define(
    "Admin",
    {
      id:{
        type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      },
        AdminId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique:true,
        },
        PassKey:{
            type: DataTypes.STRING,
            allowNull: true,
     },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      Course: {
        type: DataTypes.STRING,
        allowNull: true,
      },
     Email: {
           type: DataTypes.STRING,
           allowNull: true,
           unique:true,
           validate: {
             isEmail: true,
           },
         },
         mobileNumber: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
              len: [10, 10], 
              isNumeric: true,
            },
          },
          whatsappNumber: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
              len: [10, 10], // Phone number length check
              isNumeric: true,
            },
          },

          StartDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
          },
          
          ExpiryDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
          },
          address: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          HodName: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          logo: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          navbarColor: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          sidebarColor : {
            type : DataTypes.STRING,
            allowNull: false,
          },
          otherColor : {
            type : DataTypes.STRING,
            allowNull: true,
          },
          credentials: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "pending",
          },
        },
        {
          tableName: "Admins",
          timestamps: true, 
          underscored: true,
});





const Batch = sequelizeCon.define(
  "Batch",
    {
      batchId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey:true,
      },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
          model: Admin,  
          key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
  },

    batchName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    no_of_students: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

  },
  {
    tableName: "Batches",
    timestamps: true,
    underscored: true,
  }
);



Admin.hasMany(Batch, { foreignKey: "admin_id", onDelete: "SET NULL" });

//await sequelizeCon.sync({ force: false,alter: true  });
//await sequelizeCon.sync(); 

export  {Admin  ,  Batch};