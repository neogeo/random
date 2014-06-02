require 'timeline_id_manager'

class TimelineIdManager
	#static variable
	@@uuid = Hash.new

	def self.init
		puts "WARMIG THE TIMELINE_ID_MANAGER CACHE...."
		@timelines = Timeline.find(:all)
		@timelines.each do |timeline|
			@@uuid.store(timeline.uid, timeline.id)
			@@uuid.store(timeline.public_uid, timeline.id)
		end	
		puts "TIMELINE_ID_MANAGER - stored uuids. there are " + (@@uuid.size/2).to_s
	end

	def self.add(key, value)
		@@uuid.store(key, value)
	end

	#returns nil if key is not present
	def self.delete(key)
		@@uuid.delete(key)
	end
	
	#make sure there are no values with this timelines id, invalidates old uuids
	def self.deleteTimeline(value_timelineId)
		#if a key exists for this timeline_id, then delete it
		while @@uuid.key value_timelineId do
			TimelineIdManager.delete( @@uuid.key value_timelineId )
		end
	end

	#returns a timelne id string or nil
	def self.find(key)
		@@uuid[key]
	end

	#pass in the timeline id and it will generate a private and public key
	#and update the table
	#returns [private, public] or nil
	def self.createUIDs(timelineId)
		uniqueId = randomUUID(4)
		publicUniqueId = randomUUID(4)

		#if uniqueId is not nil
		if !uniqueId.nil? && !publicUniqueId.nil?
			
			#insert into db
			timeline = Timeline.find_by_id(timelineId)
			if timelineId
				timeline.update_attributes(:uid => uniqueId )
				timeline.update_attributes(:public_uid => publicUniqueId )

				#update the hash
				#make sure there are no values with this timelines id, invalidates old uuids
				TimelineIdManager.deleteTimeline(timelineId)
				
				#add this unique ids to the cached uuids
				TimelineIdManager.add(uniqueId, timelineId)
				TimelineIdManager.add(publicUniqueId, timelineId)

				keys = Array.new
				keys << uniqueId
				keys << publicUniqueId

				return keys
			else
				#could not save to db
				puts "failed to update the timeline with id "+timelineId
				return nil
			end
		else
			#could not generate unique id
			puts "uniqueId genrateion clash!"
			return nil
		end
	end

	#returna a random uid that does not exist in the current uuids
	#can return up to a 9 digit uuid,
	#returns the string or nil
	def self.randomUUID(size)
		#if we can't find a uuid in 9 digits, then something is wrong
		if(size == 10)
			return nil
		end

		uniqueId = ""
		#rand from 0-61
		#48-57 => 0-9
		#65-90 => A-Z
		#97-122 => a-z

		#create uid with nums, upper and lowercase
		#size.times { uniqueId << (i = Kernel.rand(62); i += ((i < 10) ? 48 : ((i < 36) ? 55 : 61 ))).chr }

		#create uid with num and lowercase (skips the upper case)
		size.times { uniqueId << (i = Kernel.rand(62); i += ((i < 10) ? 48 : ((i < 36) ? 87 : 61 ))).chr }
  		
  		#does this exist in the uuids
  		if !@@uuid[uniqueId]
  			#if not return it
  			return uniqueId
  		else
  			#try again with a slighty larger uuid size
  			TimelineIdManager.randomUUID(size+1)
  		end
	end

	def self.getHash
		return @@uuid
	end
end