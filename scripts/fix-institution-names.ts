import mongoose from 'mongoose';
import { Loan } from '../src/models/Loan';
import { Institution } from '../src/models/Institution';
import connectDB from '../src/lib/mongodb';

async function fixInstitutionNames() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    // Find all loans without institutionName or with "Unknown Institution"
    const loansToFix = await Loan.find({
      $or: [
        { institutionName: { $exists: false } },
        { institutionName: null },
        { institutionName: '' },
        { institutionName: 'Unknown Institution' }
      ]
    });
    
    console.log(`Found ${loansToFix.length} loans to fix`);
    
    for (const loan of loansToFix) {
      try {
        // Try to find the institution by institutionId
        let institution = null;
        
        if (loan.institutionId) {
          try {
            institution = await Institution.findById(loan.institutionId);
          } catch (error) {
            console.log(`Invalid institutionId for loan ${loan._id}, trying to find by name...`);
          }
        }
        
        // If not found, try to match by institution name in the database
        if (!institution) {
          const institutions = await Institution.find({ status: 'active' });
          console.log(`Available institutions:`, institutions.map(i => ({ name: i.name, id: i._id, adminUserId: i.adminUserId })));
          
          // Try to match by adminUserId if institutionId is actually an adminUserId
          institution = institutions.find(inst => 
            inst.adminUserId && inst.adminUserId.toString() === loan.institutionId.toString()
          );
          
          if (institution) {
            console.log(`Matched loan ${loan._id} to institution by adminUserId: ${institution.name}`);
            // Update both institutionId and institutionName
            loan.institutionId = institution._id.toString();
            loan.institutionName = institution.name;
          }
        } else {
          console.log(`Found institution for loan ${loan._id}: ${institution.name}`);
          loan.institutionName = institution.name;
        }
        
        if (institution) {
          await loan.save();
          console.log(`✅ Updated loan ${loan._id} with institution: ${institution.name}`);
        } else {
          console.log(`⚠️  Could not find institution for loan ${loan._id} with institutionId: ${loan.institutionId}`);
        }
      } catch (error) {
        console.error(`Error fixing loan ${loan._id}:`, error);
      }
    }
    
    console.log('\n✅ Institution name fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixInstitutionNames();

