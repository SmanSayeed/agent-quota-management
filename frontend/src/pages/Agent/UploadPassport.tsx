import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import Tesseract from 'tesseract.js';
import api from '../../api/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const passportSchema = z.object({
  passportNumber: z.string().min(1, 'Passport Number is required'),
  surname: z.string().min(1, 'Surname is required'),
  givenNames: z.string().min(1, 'Given Names is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  dateOfBirth: z.string().min(1, 'Date of Birth is required'),
  sex: z.string().min(1, 'Sex is required'),
  placeOfBirth: z.string().optional(),
  dateOfIssue: z.string().optional(),
  dateOfExpiry: z.string().min(1, 'Date of Expiry is required'),
  authority: z.string().optional(),
});

type PassportInputs = z.infer<typeof passportSchema>;

export default function UploadPassport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PassportInputs>({
    resolver: zodResolver(passportSchema),
  });



  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File; ocrData: PassportInputs }) => {
      const formData = new FormData();
      formData.append('image', data.file);
      formData.append('ocrData', JSON.stringify(data.ocrData));
      
      await api.post('/passport/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      toast.success('Passport uploaded successfully');
      handleReset();
    },
    onError: (error) => {
      console.error(error);
      toast.error('Failed to upload passport');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    processOcr(file);
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
    disabled: isOcrProcessing || uploadMutation.isPending
  });

  const processOcr = async (file: File) => {
    setIsOcrProcessing(true);
    setOcrProgress(0);
    
    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(m.progress);
          }
        },
      });

      const text = result.data.text;
      console.log('OCR Result:', text);
      
      // Try to parse MRZ first (most reliable)
      const mrzData = parseMRZ(text);
      
      if (mrzData) {
        setValue('passportNumber', mrzData.passportNumber);
        setValue('surname', mrzData.surname);
        setValue('givenNames', mrzData.givenNames);
        setValue('nationality', mrzData.nationality);
        setValue('dateOfBirth', formatDateToInput(mrzData.dateOfBirth));
        setValue('sex', mrzData.sex);
        setValue('dateOfExpiry', formatDateToInput(mrzData.dateOfExpiry));
        toast.success('Passport details extracted from MRZ successfully!');
      } else {
        // Fallback to label-based extraction
        const passportNumberMatch = text.match(/Passport No\.\s*([A-Z0-9]+)/i) || text.match(/([A-Z][0-9]{7,8})/);
        const surnameMatch = text.match(/Surname\s*([A-Z]+)/i);
        const givenNamesMatch = text.match(/Given Names\s*([A-Z\s]+)/i);
        const dobMatch = text.match(/Date of Birth\s*(\d{2}\s[A-Z]{3}\s\d{4})/i) || text.match(/(\d{2}\/\d{2}\/\d{4})/);
        const expiryMatch = text.match(/Date of Expiry\s*(\d{2}\s[A-Z]{3}\s\d{4})/i);

        if (passportNumberMatch) setValue('passportNumber', passportNumberMatch[1]);
        if (surnameMatch) setValue('surname', surnameMatch[1]);
        if (givenNamesMatch) setValue('givenNames', givenNamesMatch[1]);
        if (dobMatch) setValue('dateOfBirth', dobMatch[1]);
        if (expiryMatch) setValue('dateOfExpiry', expiryMatch[1]);
        
        if (!passportNumberMatch && !surnameMatch) {
             toast.error('Could not extract data clearly. Please verify manually.');
        } else {
             toast.success('OCR Processing Complete. Please verify details.');
        }
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error('OCR failed. Please enter details manually.');
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Helper to parse MRZ (Machine Readable Zone)
  const parseMRZ = (text: string) => {
    // Look for two lines of 44 characters
    // Line 1 starts with P, A, C, I or V usually. Passport is P.
    // We look for P<...
    const lines = text.split('\n').map(l => l.replace(/\s/g, '').toUpperCase());
    
    // Find the line starting with P<
    const line1Index = lines.findIndex(l => l.startsWith('P<') && l.length >= 44);
    if (line1Index === -1 || line1Index + 1 >= lines.length) return null;
    
    const line1 = lines[line1Index];
    const line2 = lines[line1Index + 1];
    
    if (line2.length < 44) return null;

    // Line 1: P<BGDMEEM<<MOHAMMAD<SAZZADUL<KABIR<<<<<<<<<<
    // Name extraction: chars 5 to 44
    // Split by double space (which was <<) to separate surname and given names
    // In MRZ: Surname<<Given<Names
    // After replace: Surname  Given Names
    // Note: The replace(/</g, ' ') makes it "Surname  Given Names" (double space) or "Surname Given Names" depending on logic.
    // Better approach:
    const rawName = line1.substring(5);
    const nameParts = rawName.split('<<');
    const surname = nameParts[0].replace(/</g, '').trim();
    const givenNames = nameParts.length > 1 ? nameParts[1].replace(/</g, ' ').trim() : '';

    // Line 2: BE08942860B6D9602072M2003175<<<<<<<<<<<<<<02
    // Passport No: 0-9 (9 chars)
    const passportNumber = line2.substring(0, 9).replace(/</g, '');
    
    // Nationality: 10-12 (3 chars)
    const nationality = line2.substring(10, 13).replace(/</g, '');
    
    // DOB: 13-19 (YYMMDD) -> index 13 is start, length 6
    const dobYYMMDD = line2.substring(13, 19);
    
    // Sex: 20 (1 char) - M/F/<
    const sex = line2.substring(20, 21) === 'M' ? 'Male' : line2.substring(20, 21) === 'F' ? 'Female' : '';
    
    // Expiry: 21-27 (YYMMDD) -> index 21 is start, length 6
    const expiryYYMMDD = line2.substring(21, 27);

    return {
      passportNumber,
      surname,
      givenNames,
      nationality,
      dateOfBirth: parseDateYYMMDD(dobYYMMDD),
      sex,
      dateOfExpiry: parseDateYYMMDD(expiryYYMMDD)
    };
  };

  const parseDateYYMMDD = (yymmdd: string): Date => {
    if (!yymmdd || yymmdd.length !== 6) return new Date(0);
    const yy = parseInt(yymmdd.substring(0, 2));
    const mm = parseInt(yymmdd.substring(2, 4)) - 1; // Month is 0-indexed
    const dd = parseInt(yymmdd.substring(4, 6));
    
    // Pivot year for 2-digit year. Assuming passports are relatively recent.
    // If yy > 50, assume 19yy, else 20yy. (Adjust logic as needed)
    const currentYear = new Date().getFullYear() % 100;
    const yearPrefix = yy > currentYear + 10 ? '19' : '20'; // Simple heuristic
    const fullYear = parseInt(yearPrefix + yymmdd.substring(0, 2));
    
    return new Date(fullYear, mm, dd);
  };

  const formatDateToInput = (date: Date) => {
    if (isNaN(date.getTime())) return '';
    // Format: YYYY-MM-DD for HTML5 date input
    return date.toISOString().split('T')[0];
  };

  const onSubmit = (data: PassportInputs) => {
    if (!selectedFile) {
      toast.error('Please select a passport image');
      return;
    }
    uploadMutation.mutate({ file: selectedFile, ocrData: data });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Upload Passport</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Passport Image">
          {/* Drag and Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/10'
                : 'border-base-300 hover:border-primary/50'
            } ${isOcrProcessing || uploadMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-base-content/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              {isDragActive ? (
                <p className="text-primary font-medium">Drop the passport image here...</p>
              ) : (
                <>
                  <p className="font-medium">Drag & drop passport image here</p>
                  <p className="text-sm text-base-content/60">or click to browse</p>
                </>
              )}
            </div>
          </div>

          {/* Traditional file input (hidden, controlled by dropzone) */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
          />

          {isOcrProcessing && (
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Processing OCR...</span>
                <span className="text-sm font-medium">{Math.round(ocrProgress * 100)}%</span>
              </div>
              <progress className="progress progress-primary w-full" value={ocrProgress * 100} max="100"></progress>
            </div>
          )}

          {previewUrl && (
            <div className="mt-4 border rounded-lg overflow-hidden bg-base-200 flex justify-center">
              <img src={previewUrl} alt="Passport Preview" className="max-h-96 object-contain" />
            </div>
          )}
        </Card>

        <Card title="Passport Details">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Passport Number"
                error={errors.passportNumber?.message}
                {...register('passportNumber')}
              />
              <Input
                label="Nationality"
                placeholder="e.g., BGD"
                error={errors.nationality?.message}
                {...register('nationality')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Surname"
                error={errors.surname?.message}
                {...register('surname')}
              />
              <Input
                label="Given Names"
                error={errors.givenNames?.message}
                {...register('givenNames')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Date of Birth</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  {...register('dateOfBirth')}
                />
                {errors.dateOfBirth && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.dateOfBirth.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Sex</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  {...register('sex')}
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.sex && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.sex.message}</span>
                  </label>
                )}
              </div>
            </div>

            <Input
              label="Place of Birth (Optional)"
              placeholder="e.g., Dhaka"
              error={errors.placeOfBirth?.message}
              {...register('placeOfBirth')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Date of Issue (Optional)</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  {...register('dateOfIssue')}
                />
                {errors.dateOfIssue && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.dateOfIssue.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Date of Expiry</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  {...register('dateOfExpiry')}
                />
                {errors.dateOfExpiry && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.dateOfExpiry.message}</span>
                  </label>
                )}
              </div>
            </div>

            <Input
              label="Issuing Authority (Optional)"
              placeholder="e.g., DIP/DHAKA"
              error={errors.authority?.message}
              {...register('authority')}
            />

            <div className="card-actions justify-end mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                disabled={uploadMutation.isPending}
              >
                Reset
              </Button>
              <Button
                type="submit"
                loading={uploadMutation.isPending || isOcrProcessing}
                disabled={!selectedFile}
              >
                Submit Passport
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
