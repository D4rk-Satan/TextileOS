require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const results = [];
const pass = (name) => { results.push(`✅ PASS: ${name}`); console.log(`✅ PASS: ${name}`); };
const fail = (name, err) => { results.push(`❌ FAIL: ${name} — ${err}`); console.log(`❌ FAIL: ${name} — ${err}`); };

async function runTests() {
  console.log('\n====== TextileOS SaaS Full Test Suite ======\n');

  // ─── STEP 1: CHECK DATABASE CONNECTION ───────────────────────────────────
  try {
    await prisma.$queryRaw`SELECT 1`;
    pass('Database Connection');
  } catch (e) { fail('Database Connection', e.message); }

  // ─── STEP 2: CHECK SUPERADMIN USER ───────────────────────────────────────
  let superAdmin;
  try {
    superAdmin = await prisma.user.findUnique({ where: { email: 'super@textileos.com' } });
    if (superAdmin && superAdmin.role === 'SuperAdmin') pass('SuperAdmin user exists with correct role');
    else fail('SuperAdmin user', 'User not found or wrong role');
  } catch (e) { fail('SuperAdmin user check', e.message); }

  // ─── STEP 3: CREATE TEST ORGANIZATION ────────────────────────────────────
  let org;
  try {
    org = await prisma.organization.findFirst({ where: { email: 'admin@testtextile.com' } });
    if (!org) {
      org = await prisma.organization.create({
        data: { name: 'Test Textile Co', email: 'admin@testtextile.com', phone: '9876543210', status: 'Active', plan: 'Basic' }
      });
    }
    pass('Organization created/found: ' + org.name);
  } catch (e) { fail('Create Organization', e.message); }

  // ─── STEP 4: CREATE ADMIN ROLE ────────────────────────────────────────────
  let adminRole;
  try {
    adminRole = await prisma.appRole.findFirst({ where: { organizationId: org.id, name: 'Administrator' } });
    if (!adminRole) {
      adminRole = await prisma.appRole.create({
        data: {
          name: 'Administrator',
          organizationId: org.id,
          permissions: ['master:read','master:write','warehouse:read','warehouse:write','dyeing:read','dyeing:write','printing:read','printing:write','dispatch:read','dispatch:write','settings:read','settings:team']
        }
      });
    }
    pass('Admin Role created/found');
  } catch (e) { fail('Create Admin Role', e.message); }

  // ─── STEP 5: CREATE ADMIN USER ────────────────────────────────────────────
  let adminUser;
  try {
    adminUser = await prisma.user.findUnique({ where: { email: 'admin@testtextile.com' } });
    if (!adminUser) {
      const hash = await bcrypt.hash('Admin@1234', 10);
      adminUser = await prisma.user.create({
        data: { email: 'admin@testtextile.com', password: hash, role: 'Admin', roleId: adminRole.id, organizationId: org.id }
      });
    }
    pass('Admin User created/found');
  } catch (e) { fail('Create Admin User', e.message); }

  // ─── STEP 6: VERIFY PASSWORD HASH ─────────────────────────────────────────
  try {
    const valid = await bcrypt.compare('Admin@1234', adminUser.password);
    if (valid) pass('Admin password hash is valid');
    else fail('Admin password hash', 'Password does not match');
  } catch (e) { fail('Password verification', e.message); }

  // ─── STEP 7: CREATE CUSTOMER ──────────────────────────────────────────────
  let customer;
  try {
    customer = await prisma.customer.findFirst({ where: { customerName: 'ABC Fabrics Ltd', organizationId: org.id } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { customerName: 'ABC Fabrics Ltd', phone: '9111111111', city: 'Surat', state: 'Gujarat', organizationId: org.id, status: 'Active' }
      });
    }
    pass('Customer "ABC Fabrics Ltd" created/found');
  } catch (e) { fail('Create Customer', e.message); }

  // ─── STEP 8: CREATE VENDORS ───────────────────────────────────────────────
  let dyeingVendor, printerVendor;
  try {
    dyeingVendor = await prisma.vendor.findFirst({ where: { vendorName: 'Sunrise Dyeing House', organizationId: org.id } });
    if (!dyeingVendor) {
      dyeingVendor = await prisma.vendor.create({
        data: { vendorName: 'Sunrise Dyeing House', city: 'Ahmedabad', state: 'Gujarat', organizationId: org.id, status: 'Active' }
      });
    }
    pass('Vendor "Sunrise Dyeing House" created/found');
  } catch (e) { fail('Create Dyeing Vendor', e.message); }

  try {
    printerVendor = await prisma.vendor.findFirst({ where: { vendorName: 'Galaxy Printers', organizationId: org.id } });
    if (!printerVendor) {
      printerVendor = await prisma.vendor.create({
        data: { vendorName: 'Galaxy Printers', city: 'Surat', state: 'Gujarat', organizationId: org.id, status: 'Active' }
      });
    }
    pass('Vendor "Galaxy Printers" created/found');
  } catch (e) { fail('Create Printer Vendor', e.message); }

  // ─── STEP 9: CREATE GREY INWARD ───────────────────────────────────────────
  let greyInward;
  try {
    greyInward = await prisma.greyInward.findFirst({ where: { lotNo: 'LOT-TEST-001', organizationId: org.id } });
    if (!greyInward) {
      greyInward = await prisma.greyInward.create({
        data: {
          lotNo: 'LOT-TEST-001',
          date: new Date(),
          challanNo: 'CH-001',
          quality: 'Cotton 60x60',
          processType: 'RFD',
          totalMtr: 500,
          totalBatch: 1,
          customerId: customer.id,
          organizationId: org.id,
          status: 'In-Warehouse',
          batches: {
            create: [{ batchNo: 'B001', pcs: 10, mtrs: 500, status: 'In-Warehouse' }]
          }
        },
        include: { batches: true }
      });
    } else {
      greyInward = await prisma.greyInward.findFirst({ where: { lotNo: 'LOT-TEST-001', organizationId: org.id }, include: { batches: true } });
    }
    pass(`Grey Inward LOT-TEST-001 created/found with ${greyInward.batches.length} batch(es)`);
  } catch (e) { fail('Create Grey Inward', e.message); }

  const batch = greyInward?.batches?.[0];

  // ─── STEP 10: CREATE GREY OUTWARD ─────────────────────────────────────────
  let greyOutward;
  try {
    if (!batch) throw new Error('No batch found from inward');
    greyOutward = await prisma.greyOutward.findFirst({ where: { lotNo: 'LOT-TEST-001', organizationId: org.id } });
    if (!greyOutward) {
      greyOutward = await prisma.greyOutward.create({
        data: {
          date: new Date(),
          lotNo: 'LOT-TEST-001',
          dyeingHouseId: dyeingVendor.id,
          challanNo: 'DC-001',
          remark: 'Test outward',
          organizationId: org.id,
          batches: { connect: [{ id: batch.id }] }
        }
      });
      // Update batch status
      await prisma.batch.update({ where: { id: batch.id }, data: { status: 'Out-for-Dyeing', greyOutwardId: greyOutward.id } });
    }
    pass('Grey Outward (Issue for Dyeing) created/found');
  } catch (e) { fail('Create Grey Outward', e.message); }

  // Verify batch status
  try {
    const updatedBatch = await prisma.batch.findUnique({ where: { id: batch.id } });
    if (updatedBatch.status === 'Out-for-Dyeing') pass('Batch status updated to Out-for-Dyeing');
    else fail('Batch status after outward', `Expected Out-for-Dyeing, got ${updatedBatch.status}`);
  } catch (e) { fail('Batch status verification', e.message); }

  // ─── STEP 11: CREATE RFD INWARD ───────────────────────────────────────────
  let rfdInward;
  try {
    if (!batch) throw new Error('No batch found');
    rfdInward = await prisma.rFDInward.findFirst({ where: { lotNo: 'LOT-TEST-001', organizationId: org.id } });
    if (!rfdInward) {
      rfdInward = await prisma.rFDInward.create({
        data: {
          date: new Date(),
          lotNo: 'LOT-TEST-001',
          dyeingHouseId: dyeingVendor.id,
          billNo: 'BILL-001',
          challanNo: 'RFD-CH-001',
          remark: 'Test RFD inward',
          organizationId: org.id,
          batches: { connect: [{ id: batch.id }] }
        }
      });
      await prisma.batch.update({ where: { id: batch.id }, data: { status: 'RFD-Received', rfdInwardId: rfdInward.id, rfdMtrs: 495 } });
    }
    pass('RFD Inward (Receive from Dyeing) created/found');
  } catch (e) { fail('Create RFD Inward', e.message); }

  // Verify batch status
  try {
    const updatedBatch = await prisma.batch.findUnique({ where: { id: batch.id } });
    if (updatedBatch.status === 'RFD-Received') pass('Batch status updated to RFD-Received');
    else fail('Batch status after RFD', `Expected RFD-Received, got ${updatedBatch.status}`);
  } catch (e) { fail('RFD batch status verification', e.message); }

  // ─── STEP 12: CREATE PRINTING ISSUE ──────────────────────────────────────
  let printingIssue;
  try {
    if (!batch) throw new Error('No batch found');
    printingIssue = await prisma.printingIssue.findFirst({ where: { lotNo: 'LOT-TEST-001', organizationId: org.id } });
    if (!printingIssue) {
      printingIssue = await prisma.printingIssue.create({
        data: {
          date: new Date(),
          lotNo: 'LOT-TEST-001',
          printerId: printerVendor.id,
          challanNo: 'PI-001',
          jobCardNumber: 'JC-001',
          remark: 'Test printing issue',
          organizationId: org.id,
          batches: { connect: [{ id: batch.id }] }
        }
      });
      await prisma.batch.update({ where: { id: batch.id }, data: { status: 'Out-for-Printing', printingIssueId: printingIssue.id } });
    }
    pass('Printing Issue (Issue for Printing) created/found');
  } catch (e) { fail('Create Printing Issue', e.message); }

  // ─── STEP 13: CREATE PRINTING RECEIVE ────────────────────────────────────
  let printingReceive;
  try {
    if (!batch) throw new Error('No batch found');
    printingReceive = await prisma.printingReceive.findFirst({ where: { lotNo: 'LOT-TEST-001', organizationId: org.id } });
    if (!printingReceive) {
      printingReceive = await prisma.printingReceive.create({
        data: {
          date: new Date(),
          lotNo: 'LOT-TEST-001',
          printerId: printerVendor.id,
          productionNumber: 'PROD-001',
          processType: 'RFD',
          customerId: customer.id,
          remark: 'Test printing receive',
          organizationId: org.id,
          batches: { connect: [{ id: batch.id }] }
        }
      });
      await prisma.batch.update({ where: { id: batch.id }, data: { status: 'Print-Received', printingReceiveId: printingReceive.id, printMtrs: 490 } });
    }
    pass('Printing Receive (Receive from Printing) created/found');
  } catch (e) { fail('Create Printing Receive', e.message); }

  // ─── STEP 14: CREATE DELIVERY CHALLAN ────────────────────────────────────
  let deliveryChallan;
  try {
    if (!batch) throw new Error('No batch found');
    deliveryChallan = await prisma.deliveryChallan.findFirst({ where: { organizationId: org.id } });
    if (!deliveryChallan) {
      deliveryChallan = await prisma.deliveryChallan.create({
        data: {
          date: new Date(),
          challanNo: 'DC-DISPATCH-001',
          customerId: customer.id,
          remark: 'Test dispatch',
          organizationId: org.id,
          batches: { connect: [{ id: batch.id }] }
        }
      });
      await prisma.batch.update({ where: { id: batch.id }, data: { status: 'Dispatched', deliveryChallanId: deliveryChallan.id } });
    }
    pass('Delivery Challan (Dispatch) created/found');
  } catch (e) { fail('Create Delivery Challan', e.message); }

  // Verify final batch status
  try {
    const finalBatch = await prisma.batch.findUnique({ where: { id: batch.id } });
    if (finalBatch.status === 'Dispatched') pass('Final batch status is Dispatched ✓ Full workflow complete');
    else fail('Final batch status', `Expected Dispatched, got ${finalBatch.status}`);
  } catch (e) { fail('Final batch status verification', e.message); }

  // ─── STEP 15: RBAC — CREATE STAFF ROLE ──────────────────────────────────
  let staffRole;
  try {
    staffRole = await prisma.appRole.findFirst({ where: { organizationId: org.id, name: 'Warehouse Staff' } });
    if (!staffRole) {
      staffRole = await prisma.appRole.create({
        data: { name: 'Warehouse Staff', organizationId: org.id, permissions: ['warehouse:read', 'warehouse:write'] }
      });
    }
    pass('Staff Role "Warehouse Staff" created/found with limited permissions');
  } catch (e) { fail('Create Staff Role', e.message); }

  // ─── STEP 16: RBAC — CREATE STAFF USER ──────────────────────────────────
  let staffUser;
  try {
    staffUser = await prisma.user.findUnique({ where: { email: 'staff@testtextile.com' } });
    if (!staffUser) {
      const hash = await bcrypt.hash('Staff@1234', 10);
      staffUser = await prisma.user.create({
        data: { email: 'staff@testtextile.com', password: hash, role: 'User', roleId: staffRole.id, organizationId: org.id }
      });
    }
    pass('Staff User "staff@testtextile.com" created/found');
  } catch (e) { fail('Create Staff User', e.message); }

  // ─── STEP 17: RBAC — VERIFY STAFF PERMISSIONS ────────────────────────────
  try {
    const fetchedStaff = await prisma.user.findUnique({
      where: { email: 'staff@testtextile.com' },
      include: { dynamicRole: true }
    });
    const perms = fetchedStaff.dynamicRole?.permissions || [];
    const hasWarehouse = perms.includes('warehouse:read');
    const hasMaster = perms.includes('master:write');
    if (hasWarehouse && !hasMaster) pass('RBAC: Staff has warehouse:read but NOT master:write — correct restriction');
    else fail('RBAC permission check', `warehouse:read=${hasWarehouse}, master:write=${hasMaster}`);
  } catch (e) { fail('RBAC permission verification', e.message); }

  // ─── STEP 18: QUERY SUMMARY ──────────────────────────────────────────────
  try {
    const counts = await Promise.all([
      prisma.customer.count({ where: { organizationId: org.id } }),
      prisma.vendor.count({ where: { organizationId: org.id } }),
      prisma.greyInward.count({ where: { organizationId: org.id } }),
      prisma.greyOutward.count({ where: { organizationId: org.id } }),
      prisma.rFDInward.count({ where: { organizationId: org.id } }),
      prisma.printingIssue.count({ where: { organizationId: org.id } }),
      prisma.printingReceive.count({ where: { organizationId: org.id } }),
      prisma.deliveryChallan.count({ where: { organizationId: org.id } }),
    ]);
    console.log('\n─── Data Summary ───────────────────────────────────────');
    console.log(`  Customers: ${counts[0]}`);
    console.log(`  Vendors: ${counts[1]}`);
    console.log(`  Grey Inwards: ${counts[2]}`);
    console.log(`  Grey Outwards: ${counts[3]}`);
    console.log(`  RFD Inwards: ${counts[4]}`);
    console.log(`  Printing Issues: ${counts[5]}`);
    console.log(`  Printing Receives: ${counts[6]}`);
    console.log(`  Delivery Challans: ${counts[7]}`);
    pass('Database summary query succeeded');
  } catch (e) { fail('Database summary', e.message); }

  // ─── FINAL REPORT ────────────────────────────────────────────────────────
  const passed = results.filter(r => r.startsWith('✅')).length;
  const failed = results.filter(r => r.startsWith('❌')).length;
  console.log('\n======================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================\n');
  results.forEach(r => console.log(r));

  await prisma.$disconnect();
  await pool.end();
}

runTests().catch(e => { console.error('Fatal error:', e); process.exit(1); });
