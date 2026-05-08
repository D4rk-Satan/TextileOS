require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const results = [];
const pass = (name) => { results.push(`✅ ${name}`); };
const fail = (name, detail) => { results.push(`❌ ${name} — ${detail}`); };

async function runTests() {
  console.log('\n====== TextileOS Data Integrity & Action Tests ======\n');

  const org = await prisma.organization.findFirst({ where: { email: 'admin@testtextile.com' } });
  if (!org) { console.log('❌ No test org found. Run full_test.js first.'); process.exit(1); }

  // ─── VERIFY FULL WORKFLOW DATA INTEGRITY ─────────────────────────────────
  // 1. Check batch has all foreign keys set (end-to-end traceability)
  const batch = await prisma.batch.findFirst({
    where: { batchNo: 'B001', greyInward: { organizationId: org.id } },
    include: {
      greyInward: true,
      greyOutward: true,
      rfdInward: true,
      printingIssue: true,
      printingReceive: true,
      deliveryChallan: true,
    }
  });

  if (!batch) { fail('Batch B001 lookup', 'Not found'); }
  else {
    pass(`Batch B001 found, status=${batch.status}`);
    if (batch.greyInward) pass('Batch linked to Grey Inward ✓');
    else fail('Batch → Grey Inward link', 'greyInwardId missing');

    if (batch.greyOutward) pass('Batch linked to Grey Outward ✓');
    else fail('Batch → Grey Outward link', 'greyOutwardId missing');

    if (batch.rfdInward) pass('Batch linked to RFD Inward ✓');
    else fail('Batch → RFD Inward link', 'rfdInwardId missing');

    if (batch.printingIssue) pass('Batch linked to Printing Issue ✓');
    else fail('Batch → Printing Issue link', 'printingIssueId missing');

    if (batch.printingReceive) pass('Batch linked to Printing Receive ✓');
    else fail('Batch → Printing Receive link', 'printingReceiveId missing');

    if (batch.deliveryChallan) pass('Batch linked to Delivery Challan ✓');
    else fail('Batch → Delivery Challan link', 'deliveryChallanId missing');

    // Check meter tracking
    if (batch.mtrs && Number(batch.mtrs) === 500) pass(`Original meters: ${batch.mtrs} ✓`);
    else fail('Original meters', `Expected 500, got ${batch.mtrs}`);

    if (batch.rfdMtrs && Number(batch.rfdMtrs) === 495) pass(`RFD meters: ${batch.rfdMtrs} (shortage: ${500 - 495}m) ✓`);
    else fail('RFD meters', `Expected 495, got ${batch.rfdMtrs}`);

    if (batch.printMtrs && Number(batch.printMtrs) === 490) pass(`Print meters: ${batch.printMtrs} (shortage: ${495 - 490}m) ✓`);
    else fail('Print meters', `Expected 490, got ${batch.printMtrs}`);
  }

  // ─── DATA ISOLATION TEST ─────────────────────────────────────────────────
  // Verify org isolation: Test Textile Co data shouldn't appear in other orgs
  const otherOrgs = await prisma.organization.findMany({ where: { email: { not: 'admin@testtextile.com' } } });
  for (const otherOrg of otherOrgs) {
    const leaked = await prisma.customer.findFirst({ where: { customerName: 'ABC Fabrics Ltd', organizationId: otherOrg.id } });
    if (leaked) fail(`Data isolation`, `Customer "ABC Fabrics Ltd" leaked into org: ${otherOrg.name}`);
    else pass(`Data isolation: "ABC Fabrics Ltd" NOT visible in org "${otherOrg.name}"`);
  }

  // ─── CUSTOMER CRUD ───────────────────────────────────────────────────────
  // Create a temp customer to test update/delete
  let tempCustomer;
  try {
    tempCustomer = await prisma.customer.create({
      data: { customerName: 'Temp Test Customer', organizationId: org.id, status: 'Active' }
    });
    pass('Customer CREATE: "Temp Test Customer" created');

    // Update
    await prisma.customer.update({ where: { id: tempCustomer.id }, data: { city: 'Mumbai' } });
    const updated = await prisma.customer.findUnique({ where: { id: tempCustomer.id } });
    if (updated.city === 'Mumbai') pass('Customer UPDATE: city updated to Mumbai');
    else fail('Customer UPDATE', `city = ${updated.city}`);

    // Search
    const searched = await prisma.customer.findMany({
      where: { organizationId: org.id, customerName: { contains: 'Temp', mode: 'insensitive' } }
    });
    if (searched.length > 0) pass(`Customer SEARCH: found ${searched.length} result(s) for "Temp"`);
    else fail('Customer SEARCH', 'No results for "Temp"');

    // Delete
    await prisma.customer.delete({ where: { id: tempCustomer.id } });
    const deleted = await prisma.customer.findUnique({ where: { id: tempCustomer.id } });
    if (!deleted) pass('Customer DELETE: "Temp Test Customer" deleted');
    else fail('Customer DELETE', 'Customer still exists after delete');
  } catch (e) { fail('Customer CRUD', e.message); }

  // ─── VENDOR CRUD ─────────────────────────────────────────────────────────
  let tempVendor;
  try {
    tempVendor = await prisma.vendor.create({
      data: { vendorName: 'Temp Test Vendor', organizationId: org.id, status: 'Active' }
    });
    pass('Vendor CREATE: "Temp Test Vendor" created');

    await prisma.vendor.update({ where: { id: tempVendor.id }, data: { city: 'Delhi' } });
    const updatedV = await prisma.vendor.findUnique({ where: { id: tempVendor.id } });
    if (updatedV.city === 'Delhi') pass('Vendor UPDATE: city updated to Delhi');
    else fail('Vendor UPDATE', `city = ${updatedV.city}`);

    const searchedV = await prisma.vendor.findMany({
      where: { organizationId: org.id, vendorName: { contains: 'Temp', mode: 'insensitive' } }
    });
    if (searchedV.length > 0) pass(`Vendor SEARCH: found ${searchedV.length} result(s) for "Temp"`);
    else fail('Vendor SEARCH', 'No results');

    await prisma.vendor.delete({ where: { id: tempVendor.id } });
    const deletedV = await prisma.vendor.findUnique({ where: { id: tempVendor.id } });
    if (!deletedV) pass('Vendor DELETE: "Temp Test Vendor" deleted');
    else fail('Vendor DELETE', 'Still exists');
  } catch (e) { fail('Vendor CRUD', e.message); }

  // ─── PERMISSIONS LIBRARY CHECK ───────────────────────────────────────────
  // Check that all roles have the correct permission structures
  const allRoles = await prisma.appRole.findMany({ where: { organizationId: org.id } });
  pass(`Found ${allRoles.length} role(s) for org`);
  for (const role of allRoles) {
    if (role.permissions && role.permissions.length > 0) {
      pass(`Role "${role.name}" has ${role.permissions.length} permission(s): [${role.permissions.slice(0, 3).join(', ')}...]`);
    } else {
      fail(`Role "${role.name}" permissions`, 'Empty permissions array');
    }
  }

  // ─── MULTI-ORG SUPERADMIN TEST ────────────────────────────────────────────
  const orgCount = await prisma.organization.count();
  const userCount = await prisma.user.count();
  pass(`Platform has ${orgCount} organization(s) and ${userCount} user(s) total`);

  // ─── FINAL REPORT ─────────────────────────────────────────────────────────
  const passed = results.filter(r => r.startsWith('✅')).length;
  const failed = results.filter(r => r.startsWith('❌')).length;
  console.log('\n======================================');
  console.log(`  INTEGRITY RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================\n');
  results.forEach(r => console.log(r));

  await prisma.$disconnect();
  await pool.end();
}

runTests().catch(e => { console.error('Fatal:', e); process.exit(1); });
